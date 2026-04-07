provider "aws" {
  region = var.aws_region
}

locals {
  common_tags = {
    Project     = "FloWiser"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket" "raw_events" {
  bucket = "${var.name_prefix}-raw-events"

  tags = local.common_tags
}

resource "aws_sqs_queue" "ingestion_dlq" {
  name = "${var.name_prefix}-ingestion-dlq"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret" "app_config" {
  name = "${var.name_prefix}-app-config"

  tags = local.common_tags
}

resource "aws_timestreamwrite_database" "telemetry" {
  database_name = "${var.name_prefix}_telemetry"

  tags = local.common_tags
}

resource "aws_timestreamwrite_table" "telemetry" {
  database_name = aws_timestreamwrite_database.telemetry.database_name
  table_name    = "site_telemetry"

  retention_properties {
    magnetic_store_retention_period_in_days = 365
    memory_store_retention_period_in_hours  = 24
  }

  tags = local.common_tags
}

resource "aws_db_subnet_group" "app" {
  name       = "${var.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids

  tags = local.common_tags
}

resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Postgres access for FloWiser app services"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_db_instance" "app" {
  identifier             = "${var.name_prefix}-app"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.app.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot    = true

  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "platform" {
  dashboard_name = "${var.name_prefix}-platform"

  dashboard_body = file("${path.module}/../cloudwatch/platform-dashboard.json")
}
