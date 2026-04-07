module "foundation" {
  source             = "../../aws/foundation"
  name_prefix        = "flowiser-staging"
  environment        = "staging"
  aws_region         = var.aws_region
  vpc_id             = var.vpc_id
  private_subnet_ids = var.private_subnet_ids
  db_username        = var.db_username
  db_password        = var.db_password
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}
