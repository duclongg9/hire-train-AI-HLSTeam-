locals {
  common_tags = merge({ Project = var.project_name, Environment = var.environment, ManagedBy = "terraform" }, var.tags)
  ec2_ami_id  = var.ec2_ami_id != "" ? var.ec2_ami_id : data.aws_ssm_parameter.ubuntu_ami.value
  
  docker_user_data = <<-EOT
    #!/bin/bash
    export DEBIAN_FRONTEND=noninteractive
    
    # Update packages and install prerequisites
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release unzip
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf awscliv2.zip aws/
    
    # Add Docker GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up official Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      
    # Install Docker and Docker Compose
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Grant permissions to default users
    usermod -aG docker ubuntu || true
    usermod -aG docker ec2-user || true
    
    # Create symlink for docker-compose command compatibility
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/bin/docker-compose || true
  EOT
}

data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
}

module "vpc" {
  source              = "./modules/vpc"
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidr  = var.public_subnet_cidr
  private_subnet_cidr = var.private_subnet_cidr
  availability_zone   = var.availability_zone
  aws_region          = var.aws_region
  project_name        = var.project_name
  tags                = local.common_tags
}

module "ecr" {
  source          = "./modules/ecr"
  repository_name = var.ecr_repository_name
  scan_on_push    = true
  tags            = local.common_tags
}

module "s3_internal" {
  source      = "./modules/s3_internal"
  bucket_name = var.s3_internal_bucket_name
  tags        = local.common_tags
}

module "s3_assets" {
  source      = "./modules/s3_assets"
  bucket_name = var.s3_assets_bucket_name
  tags        = local.common_tags
}

module "iam" {
  source                 = "./modules/iam"
  github_org             = var.github_org
  github_repo            = var.github_repo
  github_branch          = var.github_branch
  ecr_repository_arns    = [module.ecr.repository_arn]
  s3_internal_bucket_arn = module.s3_internal.bucket_arn
  tags                   = local.common_tags
}

resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ec2_key_pair" {
  key_name   = "${var.project_name}-ec2-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

module "frontend_ec2" {
  source           = "./modules/ec2"
  name             = "frontend"
  ami_id           = local.ec2_ami_id
  instance_type    = var.frontend_instance_type
  root_volume_size = var.ec2_root_volume_size
  root_volume_type = var.ec2_root_volume_type
  subnet_id        = module.vpc.public_subnet_id
  vpc_id           = module.vpc.vpc_id
  key_name         = aws_key_pair.ec2_key_pair.key_name
  user_data     = local.docker_user_data
  ingress_rules = [
    { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 22, to_port = 22, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ]
  iam_instance_profile = module.iam.ec2_instance_profile_name
  tags                 = merge(local.common_tags, { Role = "frontend" })
}

module "backend_ec2" {
  source           = "./modules/ec2"
  name             = "backend"
  ami_id           = local.ec2_ami_id
  instance_type    = var.backend_instance_type
  root_volume_size = var.ec2_root_volume_size
  root_volume_type = var.ec2_root_volume_type
  subnet_id        = module.vpc.public_subnet_id
  vpc_id           = module.vpc.vpc_id
  key_name         = aws_key_pair.ec2_key_pair.key_name
  user_data     = local.docker_user_data
  ingress_rules = [
    { from_port = 8000, to_port = 8000, protocol = "tcp", source_security_group_id = module.frontend_ec2.security_group_id },
    { from_port = 22, to_port = 22, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ]
  iam_instance_profile = module.iam.ec2_instance_profile_name
  tags                 = merge(local.common_tags, { Role = "backend" })
}

# module "test_ec2" {
#   source        = "./modules/ec2"
#   name          = "test"
#   ami_id        = var.ec2_ami_id
#   instance_type = var.frontend_instance_type
#   subnet_id     = module.vpc.public_subnet_id
#   vpc_id        = module.vpc.vpc_id
#   key_name      = aws_key_pair.ec2_key_pair.key_name
#   user_data     = local.docker_user_data
#   ingress_rules = [
#     { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
#     { from_port = 8000, to_port = 8000, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
#     { from_port = 8001, to_port = 8001, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
#     { from_port = 22, to_port = 22, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
#   ]
#   iam_instance_profile = module.iam.ec2_instance_profile_name
#   tags                 = merge(local.common_tags, { Role = "test" })
# }

module "elasticache" {
  source          = "./modules/elasticache"
  cluster_id      = "hls-redis"
  node_type       = var.cache_node_type
  num_cache_nodes = var.cache_num_nodes
  subnet_ids      = [module.vpc.private_subnet_id]
  vpc_id          = module.vpc.vpc_id
  allowed_sg_ids  = [module.backend_ec2.security_group_id]
  tags            = local.common_tags
}

module "secrets" {
  source                    = "./modules/secrets"
  project_name              = var.project_name
  database_url              = var.database_url
  supabase_url              = var.supabase_url
  supabase_service_role_key = var.supabase_service_role_key
  gemini_api_key            = var.gemini_api_key
  tags                      = local.common_tags
}

# AI Services IAM Policy for Backend EC2
resource "aws_iam_role_policy" "backend_ai_services" {
  name = "${var.project_name}-backend-ai-services-policy"
  role = module.iam.backend_iam_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # Bedrock permissions
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",

          # Polly permissions
          "polly:SynthesizeSpeech",
          "polly:DescribeVoices",

          # Transcribe permissions
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:StartStreamTranscription",
          "transcribe:StartStreamTranscriptionWebSocket"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [module.secrets.secret_arn]
      }
    ]
  })
}
# Root module — module wiring defined in task 11

resource "local_file" "pem_file" {
  content         = tls_private_key.ec2_key.private_key_pem
  filename        = "${path.module}/ec2-key.pem"
  file_permission = "0400"
}

resource "aws_secretsmanager_secret" "ssh_key" {
  name                    = "${var.project_name}-ssh-key"
  recovery_window_in_days = 0
  tags                    = local.common_tags
}

resource "aws_secretsmanager_secret_version" "ssh_key_val" {
  secret_id     = aws_secretsmanager_secret.ssh_key.id
  secret_string = tls_private_key.ec2_key.private_key_pem
}
