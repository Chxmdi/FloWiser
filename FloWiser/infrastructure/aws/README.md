# AWS foundation notes

Epic 1 treats AWS as the default target platform. The environment bootstrap is intentionally split into:

- `foundation/` — shared resource module
- `cloudwatch/` — starter dashboard payload
- `envs/dev` and `envs/staging` — environment entry points

Before applying any infrastructure:
1. confirm naming standards
2. confirm VPC and subnet inputs
3. confirm IAM boundary requirements
4. confirm secrets ownership and rotation policy
5. confirm environment tagging
