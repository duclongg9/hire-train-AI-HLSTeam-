
# ---------------------------------------------------------------------------
# ElastiCache Module — main.tf
#
# Provisions:
#   1. ElastiCache subnet group (using var.subnet_ids)
#   2. Security group — ingress TCP 6379 from each SG in var.allowed_sg_ids
#                       egress  TCP 6379 to VPC CIDR only
#   3. ElastiCache cluster (engine = "redis")
# ---------------------------------------------------------------------------

# Resolve the VPC CIDR for the egress rule without requiring it as an extra variable.
data "aws_vpc" "selected" {
  id = var.vpc_id
}

# ---------------------------------------------------------------------------
# 1. Subnet group — places the cluster nodes in the supplied private subnets
# ---------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "this" {
  name        = "${var.cluster_id}-subnet-group"
  description = "ElastiCache subnet group for cluster ${var.cluster_id}"
  subnet_ids  = var.subnet_ids

  tags = var.tags
}

# ---------------------------------------------------------------------------
# 2. Security group — empty by default, populated by standalone rules below
#    Ingress : TCP 6379 from each security group in var.allowed_sg_ids
#    Egress  : TCP 6379 to VPC CIDR only (no arbitrary outbound connections)
# ---------------------------------------------------------------------------
resource "aws_security_group" "this" {
  name        = "${var.cluster_id}-sg"
  description = "Security group for ElastiCache cluster ${var.cluster_id}"
  vpc_id      = var.vpc_id

  tags = var.tags
}

# Ingress rules: One rule per allowed source security group
resource "aws_security_group_rule" "ingress_from_allowed" {
  # Chuyển từ for_each sang dùng count kết hợp với hàm length()
  count = length(var.allowed_sg_ids)

  type                     = "ingress"
  security_group_id        = aws_security_group.this.id
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  # Truy cập từng phần tử thông qua index của vòng lặp count
  source_security_group_id = var.allowed_sg_ids[count.index]
  description              = "Allow Redis from SG ${var.allowed_sg_ids[count.index]}"
}

# Egress rule: Restricted to TCP 6379 to VPC CIDR only
resource "aws_security_group_rule" "egress_to_vpc" {
  type              = "egress"
  security_group_id = aws_security_group.this.id
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = [data.aws_vpc.selected.cidr_block]
  description       = "Allow Redis egress to VPC CIDR only"
}

# ---------------------------------------------------------------------------
# 3. ElastiCache cluster (Redis)
# ---------------------------------------------------------------------------
resource "aws_elasticache_cluster" "this" {
  cluster_id           = var.cluster_id
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.this.id]

  tags = var.tags
}
