# ----------------------------------------------------
# OIDC PROVIDER & GITHUB ACTIONS ROLE
# ----------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [] # Giữ nguyên, dù AWS hiện đã tự động trust Github
  tags            = var.tags
}

data "aws_iam_policy_document" "github_trust" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # FIX 1: Đã sửa lỗi khoảng trắng trong Terraform Interpolation
      values   = ["repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}"]
    }
    
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.github_repo}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_trust.json
  tags               = var.tags
}

# Sử dụng aws_iam_policy_document thay vì jsonencode (Best Practice)
data "aws_iam_policy_document" "github_ecr_policy" {
  statement {
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer"
    ]
    resources = var.ecr_repository_arns
  }

  statement {
    effect    = "Allow"
    actions   = ["ssm:SendCommand"]
    resources = [
      "arn:aws:ec2:*:*:instance/*",
      "arn:aws:ssm:*:*:document/AWS-RunShellScript"
    ]
  }
}

resource "aws_iam_role_policy" "github_ecr_policy" {
  name   = "github-ecr-policy"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_ecr_policy.json
}

# ----------------------------------------------------
# EC2 BACKEND ROLE
# ----------------------------------------------------

data "aws_iam_policy_document" "ec2_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${var.github_repo}-ec2-backend"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
  tags               = var.tags
}

# Policy cho EC2 truy cập ECR và S3
data "aws_iam_policy_document" "ec2_policy" {
  statement {
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    effect    = "Allow"
    actions   = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability" # FIX 2: Bổ sung quyền bắt buộc để EC2 pull được Docker Image
    ]
    resources = var.ecr_repository_arns
  }

  # FIX 3: Sử dụng Dynamic Block để xử lý điều kiện S3 an toàn, tránh lỗi mảng rỗng của AWS IAM
  dynamic "statement" {
    for_each = length(var.s3_internal_bucket_arn) > 0 ? [8] : []
    content {
      effect    = "Allow"
      actions   = ["s3:GetObject", "s3:PutObject"]
      resources = ["${var.s3_internal_bucket_arn}/*"]
    }
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name   = "ec2-ecr-s3-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_policy.json
}

# FIX 4: Đính kèm AWS Managed Policy cho phép SSM Agent chạy trên EC2
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.github_repo}-ec2-profile"
  role = aws_iam_role.ec2.name
}