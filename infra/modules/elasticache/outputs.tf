output "cache_endpoint" { value = aws_elasticache_cluster.this.cache_nodes[0].address }
output "cache_port" { value = aws_elasticache_cluster.this.cache_nodes[0].port }
# ElastiCache module — outputs defined in task 4.3
