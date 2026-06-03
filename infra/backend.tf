# terraform {
#   backend "s3" {
#     bucket  = "hls-terraform-state"
#     key     = "infra/terraform.tfstate"
#     encrypt = true
#     region = "us-east-1"
#     profile = "HLSTeam"
#   }
# }
# # Root module — remote state backend configuration defined in task 9.2
