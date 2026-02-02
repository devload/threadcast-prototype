# ThreadCast AWS 아키텍처

## 개요

ThreadCast는 AWS 클라우드 서비스를 활용하여 고가용성과 확장성을 갖춘 웹 애플리케이션으로 배포됩니다.

## 아키텍처 다이어그램

```
                                    ┌─────────────────────────────────────┐
                                    │           Internet                   │
                                    └─────────────────┬───────────────────┘
                                                      │
                                    ┌─────────────────┴───────────────────┐
                                    │           Route 53                   │
                                    │         threadcast.io               │
                                    └─────────────────┬───────────────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          │                           │                           │
                          ▼                           ▼                           ▼
              ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
              │    CloudFront     │      │    EC2 Instance   │      │   (Future: ALB)   │
              │   threadcast.io   │      │ api.threadcast.io │      │                   │
              │    (Frontend)     │      │    (Backend)      │      │                   │
              └─────────┬─────────┘      └─────────┬─────────┘      └───────────────────┘
                        │                          │
                        ▼                          │
              ┌───────────────────┐                │
              │    S3 Bucket      │                │
              │  Static Assets    │                │
              │  (React Build)    │                │
              └───────────────────┘                │
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                    │     threadcast-vpc          │
                                    │       10.0.0.0/16           │
                                    │                             │
                                    │  ┌────────────────────────┐ │
                                    │  │   Public Subnets       │ │
                                    │  │   10.0.1.0/24 (2a)     │ │
                                    │  │   10.0.2.0/24 (2c)     │ │
                                    │  │                        │ │
                                    │  │  ┌──────────────────┐  │ │
                                    │  │  │  EC2 Instance    │  │ │
                                    │  │  │  Spring Boot     │  │ │
                                    │  │  │  t3.micro        │  │ │
                                    │  │  └────────┬─────────┘  │ │
                                    │  └───────────┼────────────┘ │
                                    │              │              │
                                    │  ┌───────────┼────────────┐ │
                                    │  │   Private Subnets      │ │
                                    │  │   10.0.10.0/24 (2a)    │ │
                                    │  │   10.0.11.0/24 (2c)    │ │
                                    │  │              │         │ │
                                    │  │  ┌──────────▼───────┐  │ │
                                    │  │  │  RDS PostgreSQL  │  │ │
                                    │  │  │  db.t3.micro     │  │ │
                                    │  │  └──────────────────┘  │ │
                                    │  └────────────────────────┘ │
                                    │                             │
                                    └─────────────────────────────┘
```

## 컴포넌트 상세

### 1. DNS (Route 53)

| 레코드 | 타입 | 값 | 설명 |
|--------|------|-----|------|
| threadcast.io | A (Alias) | CloudFront | 메인 도메인 |
| www.threadcast.io | CNAME | threadcast.io | www 리다이렉트 |
| api.threadcast.io | A | EC2 Elastic IP | API 엔드포인트 |

### 2. CDN (CloudFront)

- **Origin**: S3 버킷 (threadcast-web-prod)
- **SSL**: ACM 인증서 (*.threadcast.io)
- **Cache Policy**: CachingOptimized
- **Price Class**: PriceClass_200 (아시아, 유럽, 북미)
- **Error Pages**: 404 → /index.html (SPA 라우팅)

### 3. Frontend Storage (S3)

- **Bucket**: threadcast-web-prod
- **Static Website Hosting**: 활성화
- **Access**: CloudFront OAC를 통한 접근
- **Versioning**: 활성화 (롤백 지원)

### 4. Backend Compute (EC2)

| 속성 | 값 |
|------|-----|
| Instance Type | t3.micro (프리티어) |
| AMI | Amazon Linux 2023 |
| Storage | 20GB gp3 |
| Runtime | Java 17 (Amazon Corretto) |
| Framework | Spring Boot 3.x |
| Process Manager | systemd |

**Ports**:
- 22: SSH
- 80: HTTP (리다이렉트)
- 443: HTTPS
- 8080: Spring Boot

### 5. Database (RDS)

| 속성 | 값 |
|------|-----|
| Engine | PostgreSQL 15 |
| Instance Class | db.t3.micro |
| Storage | 20GB gp2 |
| Multi-AZ | No (비용 절감) |
| Backup | 7일 보관 |
| Encryption | 활성화 |

### 6. Network (VPC)

```
VPC: 10.0.0.0/16
├── Public Subnet 1: 10.0.1.0/24 (ap-northeast-2a)
│   └── EC2 Instance
├── Public Subnet 2: 10.0.2.0/24 (ap-northeast-2c)
│   └── (Future: ALB, NAT Gateway)
├── Private Subnet 1: 10.0.10.0/24 (ap-northeast-2a)
│   └── RDS Primary
└── Private Subnet 2: 10.0.11.0/24 (ap-northeast-2c)
    └── RDS Standby (Multi-AZ 시)
```

### 7. Security Groups

**threadcast-ec2-sg**:
| 방향 | 프로토콜 | 포트 | 소스 |
|------|----------|------|------|
| Inbound | TCP | 22 | Your IP |
| Inbound | TCP | 80 | 0.0.0.0/0 |
| Inbound | TCP | 443 | 0.0.0.0/0 |
| Inbound | TCP | 8080 | 0.0.0.0/0 |
| Outbound | All | All | 0.0.0.0/0 |

**threadcast-rds-sg**:
| 방향 | 프로토콜 | 포트 | 소스 |
|------|----------|------|------|
| Inbound | TCP | 5432 | threadcast-ec2-sg |
| Outbound | All | All | 0.0.0.0/0 |

## 데이터 흐름

### 1. Frontend 요청

```
User → Route 53 (threadcast.io)
     → CloudFront (캐시 확인)
     → S3 (캐시 미스 시)
     → CloudFront (캐싱)
     → User
```

### 2. API 요청

```
User → Route 53 (api.threadcast.io)
     → EC2 Elastic IP
     → Spring Boot (8080)
     → RDS PostgreSQL
     → Response
```

### 3. WebSocket 연결

```
User → Route 53 (api.threadcast.io)
     → EC2 Elastic IP
     → Spring Boot WebSocket
     → Persistent Connection
```

## 보안 설계

### 1. 네트워크 보안

- **VPC Isolation**: 전용 VPC 내 모든 리소스
- **Private Subnets**: RDS는 인터넷에서 직접 접근 불가
- **Security Groups**: 최소 권한 원칙 적용

### 2. 데이터 보안

- **Encryption in Transit**: HTTPS, TLS 1.2+
- **Encryption at Rest**: RDS 스토리지 암호화
- **Credentials**: 환경 변수로 관리 (Secrets Manager 권장)

### 3. 인증/인가

- **JWT**: 세션 관리
- **OAuth 2.0**: SessionCast 연동 (선택)
- **CORS**: 허용된 오리진만 접근

## 확장 계획

### Phase 1: 현재 (MVP)

- 단일 EC2 인스턴스
- 단일 AZ RDS
- CloudFront + S3

### Phase 2: 가용성 향상

```
┌─────────────────────────────────────────┐
│              ALB                        │
│    (Application Load Balancer)          │
└───────────────┬─────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌───────┐   ┌───────┐   ┌───────┐
│ EC2-1 │   │ EC2-2 │   │ EC2-3 │
│  2a   │   │  2c   │   │  2a   │
└───────┘   └───────┘   └───────┘
```

- ALB 추가
- Auto Scaling Group
- Multi-AZ RDS

### Phase 3: 컨테이너화

```
┌─────────────────────────────────────────┐
│              ALB                        │
└───────────────┬─────────────────────────┘
                │
    ┌───────────┴───────────┐
    ▼                       ▼
┌─────────────┐     ┌─────────────┐
│ ECS Fargate │     │ ECS Fargate │
│  Service    │     │  Service    │
└─────────────┘     └─────────────┘
```

- ECS Fargate 마이그레이션
- ECR에 Docker 이미지
- CodePipeline CI/CD

## 모니터링

### 현재

- CloudWatch Logs (EC2 로그)
- CloudWatch Metrics (기본 메트릭)
- systemd 로그

### 권장 (향후)

- CloudWatch Alarms (임계값 알림)
- X-Ray (분산 추적)
- CloudWatch Container Insights (ECS 사용 시)

## 비용 요약

### 현재 (최소 스펙)

| 서비스 | 월간 비용 |
|--------|----------|
| EC2 t3.micro | ~$8 |
| RDS db.t3.micro | ~$15 |
| S3 + CloudFront | ~$2 |
| Route 53 | ~$0.50 |
| **합계** | **~$25/월** |

### 프리티어 적용 시

| 서비스 | 월간 비용 |
|--------|----------|
| EC2 t3.micro | $0 (750시간/월) |
| RDS db.t3.micro | $0 (750시간/월) |
| S3 + CloudFront | ~$2 |
| Route 53 | ~$0.50 |
| **합계** | **~$3/월** |

## 참고 자료

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Spring Boot on AWS](https://aws.amazon.com/blogs/opensource/getting-started-with-spring-boot-on-aws/)
- [CloudFront with S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html)
