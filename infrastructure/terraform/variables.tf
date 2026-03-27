variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "flowforge"
}

variable "environment" {
  description = "Deployment environment (prod | staging)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet (EC2)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidrs" {
  description = "CIDRs for private subnets (RDS requires ≥ 2 AZs)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for the application server"
  type        = string
  default     = "t3.medium"
}

variable "ec2_ami_id" {
  description = "Amazon Linux 2023 AMI ID (update per region)"
  type        = string
  default     = "ami-0f5ee92e2d63afc18"  # ap-south-1 AL2023
}

variable "ec2_key_pair" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_storage_gb" {
  description = "Initial RDS storage in GiB"
  type        = number
  default     = 20
}

variable "db_name" {
  type    = string
  default = "flowforge"
}

variable "db_username" {
  type      = string
  default   = "flowforge"
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "allowed_cidr" {
  description = "CIDR allowed to SSH into EC2 (set to your IP)"
  type        = string
  default     = "0.0.0.0/0"
}
