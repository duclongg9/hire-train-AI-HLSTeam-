// NOTE: removed duplicated/older resource blocks and retained the
// carefully authored `*.main` resources below. See commit message.
# infra/modules/vpc/main.tf
# VPC module — creates the network foundation for the HLS backend platform.
#
# Resources created:
#   - aws_vpc                        (DNS hostnames + resolution enabled)
#   - aws_subnet.public              (map_public_ip_on_launch = true)
#   - aws_subnet.private
#   - aws_internet_gateway           (attached to VPC)
#   - aws_eip                        (for NAT Gateway)
#   - aws_nat_gateway                (in public subnet)
#   - aws_route_table.public         (default → IGW)
#   - aws_route_table_association.public
#   - aws_route_table.private        (default → NAT)
#   - aws_route_table_association.private
#   - aws_security_group.vpc_endpoints (inbound TCP 443 from vpc_cidr only)
#   - aws_vpc_endpoint.ecr_api       (Interface, private subnet)
#   - aws_vpc_endpoint.ecr_dkr       (Interface, private subnet)
#
# Validates: Requirements 1.1–1.9, 1.11, 1.12

# ---------------------------------------------------------------------------
# Data source — resolve current AWS region for endpoint service names
# ---------------------------------------------------------------------------

data "aws_region" "current" {}

# ---------------------------------------------------------------------------
# VPC
# ---------------------------------------------------------------------------

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc"
  })
}

# ---------------------------------------------------------------------------
# Subnets
# ---------------------------------------------------------------------------

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone != "" ? var.availability_zone : null
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-subnet"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidr
  availability_zone       = var.availability_zone != "" ? var.availability_zone : null
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-subnet"
    Tier = "private"
  })
}

# ---------------------------------------------------------------------------
# Internet Gateway
# ---------------------------------------------------------------------------

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-igw"
  })
}

# ---------------------------------------------------------------------------
# Elastic IP and NAT Gateway (placed in public subnet)
# ---------------------------------------------------------------------------

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-eip"
  })

  # EIP must be created after the IGW is attached so the allocation is
  # associated with the VPC's internet-routable address space.
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-gw"
  })

  depends_on = [aws_internet_gateway.main]
}

# ---------------------------------------------------------------------------
# Route Tables
# ---------------------------------------------------------------------------

# Public route table — default route via Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Private route table — default route via NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-rt"
  })
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ---------------------------------------------------------------------------
# Security Group for VPC Interface Endpoints
# Allows inbound HTTPS (TCP 443) from within the VPC CIDR only.
# ---------------------------------------------------------------------------

resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg"
  description = "Allow inbound HTTPS from within the VPC for ECR Interface Endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC CIDR"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  # No egress rules needed — endpoints communicate back over the same
  # established TCP connection; AWS manages the return path.
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-endpoints-sg"
  })
}

# ---------------------------------------------------------------------------
# VPC Interface Endpoints for ECR (PrivateLink)
# Placed in the private subnet so backend EC2 image pulls never traverse
# the NAT Gateway or reach the public internet.
# ---------------------------------------------------------------------------

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-api-endpoint"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-ecr-dkr-endpoint"
  })
}

# ---------------------------------------------------------------------------
# Gateway VPC Endpoint for S3 (so ECR image layers hosted on S3 are fetched
# over AWS network instead of traversing the NAT Gateway/public internet).
# ---------------------------------------------------------------------------
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags = merge(var.tags, {
    Name = "${var.project_name}-s3-endpoint"
  })
}
