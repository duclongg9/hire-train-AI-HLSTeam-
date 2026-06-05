locals {
  common_tags = merge({ Project = var.project_name, Environment = var.environment, ManagedBy = "terraform" }, var.tags)
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

module "frontend_ec2" {
  source        = "./modules/ec2"
  name          = "frontend"
  ami_id        = var.ec2_ami_id
  instance_type = var.frontend_instance_type
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
  ingress_rules = [
    { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ]
  iam_instance_profile = module.iam.ec2_instance_profile_name
  tags                 = merge(local.common_tags, { Role = "frontend" })
}

module "backend_ec2" {
  source        = "./modules/ec2"
  name          = "backend"
  ami_id        = var.ec2_ami_id
  instance_type = var.backend_instance_type
  subnet_id     = module.vpc.private_subnet_id
  vpc_id        = module.vpc.vpc_id
  ingress_rules = [
    { from_port = 8000, to_port = 8000, protocol = "tcp", source_security_group_id = module.frontend_ec2.security_group_id }
  ]
  iam_instance_profile = module.iam.ec2_instance_profile_name
  tags                 = merge(local.common_tags, { Role = "backend" })
}

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
          "transcribe:StartStreamTranscription"
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
