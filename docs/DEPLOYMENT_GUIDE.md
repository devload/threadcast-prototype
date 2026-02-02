# ThreadCast AWS 배포 가이드

이 문서는 ThreadCast를 AWS에 배포하는 전체 과정을 설명합니다.

## 목차

1. [사전 준비](#사전-준비)
2. [도메인 설정](#도메인-설정)
3. [인프라 생성](#인프라-생성)
4. [애플리케이션 배포](#애플리케이션-배포)
5. [검증](#검증)
6. [문제 해결](#문제-해결)

---

## 사전 준비

### 필요한 도구

```bash
# AWS CLI 설치 (macOS)
brew install awscli

# AWS CLI 설정
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-northeast-2
# Default output format: json

# jq 설치 (JSON 처리용)
brew install jq
```

### AWS 계정 권한

다음 서비스에 대한 권한이 필요합니다:
- EC2 (인스턴스, VPC, Security Group, Elastic IP)
- RDS (PostgreSQL)
- S3 (버킷 생성 및 객체 관리)
- CloudFront (배포 생성)
- Route 53 (DNS 관리)
- ACM (인증서 관리)

### 스크립트 실행 권한

```bash
cd /Users/devload/threadcast/deploy
chmod +x aws/*.sh
chmod +x ec2/*.sh
chmod +x *.sh
```

---

## 도메인 설정

### 1. Route 53에 도메인 등록/이전

도메인이 이미 있는 경우:
```bash
# Route 53 Hosted Zone 생성
aws route53 create-hosted-zone \
    --name threadcast.io \
    --caller-reference "threadcast-$(date +%s)"
```

출력된 Name Server를 도메인 등록업체에 설정합니다.

### 2. SSL 인증서 요청

```bash
cd deploy/aws
./setup-acm.sh
```

이 스크립트는:
- us-east-1 리전에 SSL 인증서 요청 (CloudFront용)
- DNS 검증 레코드 자동 생성 (Route 53 사용 시)
- 인증서 검증 대기

---

## 인프라 생성

### 실행 순서

다음 순서대로 스크립트를 실행합니다:

```bash
cd deploy/aws

# 1. VPC 및 네트워크 생성
./setup-vpc.sh

# 2. Security Group 생성
./setup-security-groups.sh

# 3. RDS 인스턴스 생성 (약 10-15분 소요)
./setup-rds.sh

# 4. EC2 인스턴스 생성
./setup-ec2.sh

# 5. S3 + CloudFront 생성
./setup-s3-cloudfront.sh

# 6. Route 53 DNS 레코드 설정
./setup-route53.sh

# 7. CloudFront SSL 적용
./update-cloudfront-ssl.sh
```

### 생성되는 리소스

| 리소스 | 이름 | 스펙 |
|--------|------|------|
| VPC | threadcast-vpc | 10.0.0.0/16 |
| EC2 | threadcast-server | t3.micro |
| RDS | threadcast-db | db.t3.micro, PostgreSQL 15 |
| S3 | threadcast-web-prod | 정적 웹 호스팅 |
| CloudFront | - | PriceClass_200 |

### 리소스 ID 확인

모든 리소스 ID는 자동으로 저장됩니다:
```bash
cat /tmp/threadcast-vpc-ids.env
```

---

## 애플리케이션 배포

### 1. EC2 서버 설정

```bash
# EC2에 SSH 접속
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP>

# Java 및 환경 설정
curl -O https://raw.githubusercontent.com/.../setup-java.sh
chmod +x setup-java.sh
./setup-java.sh
```

또는 로컬에서:
```bash
scp -i ~/.ssh/threadcast-key.pem deploy/ec2/setup-java.sh ec2-user@<ELASTIC_IP>:/tmp/
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP> 'chmod +x /tmp/setup-java.sh && /tmp/setup-java.sh'
```

### 2. 환경 변수 설정

EC2 서버에서:
```bash
mkdir -p /home/ec2-user/threadcast
cat > /home/ec2-user/threadcast/.env << 'EOF'
DB_HOST=threadcast-db.xxxxx.ap-northeast-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=threadcast
DB_USERNAME=threadcast
DB_PASSWORD=your-password-here
JWT_SECRET=your-256-bit-key-here
SPRING_PROFILES_ACTIVE=prod
EOF
chmod 600 /home/ec2-user/threadcast/.env
```

### 3. Backend 배포

```bash
cd deploy
./deploy-backend.sh
```

또는 수동으로:
```bash
# 빌드
cd threadcast-server
./gradlew clean build -x test

# 업로드
scp -i ~/.ssh/threadcast-key.pem build/libs/threadcast-server-*.jar \
    ec2-user@<ELASTIC_IP>:/home/ec2-user/threadcast/threadcast-server.jar

# 서비스 시작
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP> \
    'sudo systemctl restart threadcast'
```

### 4. Frontend 배포

```bash
cd deploy
./deploy-frontend.sh
```

또는 수동으로:
```bash
# 빌드
cd threadcast-web
VITE_API_URL=https://api.threadcast.io/api \
VITE_WS_URL=wss://api.threadcast.io/ws \
npm run build

# 업로드
aws s3 sync dist/ s3://threadcast-web-prod/ --delete

# CloudFront 캐시 무효화
aws cloudfront create-invalidation \
    --distribution-id <DISTRIBUTION_ID> \
    --paths "/*"
```

### 5. 전체 배포 (한 번에)

```bash
./deploy-all.sh
```

---

## 검증

### Health Check

```bash
# Backend API
curl https://api.threadcast.io/api/health

# Frontend
curl -I https://threadcast.io
```

### 로그 확인

```bash
# EC2에서 애플리케이션 로그
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP> \
    'sudo journalctl -u threadcast -f'

# 또는
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP> \
    'tail -f /home/ec2-user/threadcast/logs/threadcast.log'
```

### 데이터베이스 연결 테스트

```bash
# EC2에서 RDS 연결 테스트
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP>
psql -h threadcast-db.xxxxx.rds.amazonaws.com -U threadcast -d threadcast
```

### WebSocket 테스트

```javascript
// 브라우저 콘솔에서
const ws = new WebSocket('wss://api.threadcast.io/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

---

## 문제 해결

### EC2 접속 불가

```bash
# Security Group 확인
aws ec2 describe-security-groups --group-ids <EC2_SG_ID>

# SSH 포트 (22) 열려있는지 확인
# 필요시 추가:
aws ec2 authorize-security-group-ingress \
    --group-id <EC2_SG_ID> \
    --protocol tcp --port 22 --cidr 0.0.0.0/0
```

### RDS 연결 실패

```bash
# Security Group 확인 - EC2에서 RDS로 5432 포트 허용되어 있는지
aws ec2 describe-security-groups --group-ids <RDS_SG_ID>

# RDS가 private subnet에 있고 EC2와 같은 VPC에 있는지 확인
```

### CloudFront 504 에러

- S3 버킷 정책 확인
- Origin Access Control 설정 확인
- 캐시 무효화 후 재시도

### SSL 인증서 에러

```bash
# 인증서 상태 확인
aws acm describe-certificate \
    --certificate-arn <CF_CERT_ARN> \
    --region us-east-1

# 상태가 PENDING_VALIDATION이면 DNS 레코드 확인
```

### 애플리케이션 시작 실패

```bash
# 서비스 상태 확인
sudo systemctl status threadcast

# 상세 로그
sudo journalctl -u threadcast --no-pager -n 100

# 환경 변수 확인
cat /home/ec2-user/threadcast/.env

# 수동 실행으로 에러 확인
java -jar /home/ec2-user/threadcast/threadcast-server.jar --spring.profiles.active=prod
```

---

## 비용 최적화

### 예상 월간 비용 (최소 스펙)

| 서비스 | 스펙 | 비용 |
|--------|------|------|
| EC2 | t3.micro | $0 (프리티어) 또는 ~$8 |
| RDS | db.t3.micro | $0 (프리티어) 또는 ~$15 |
| S3 | 1GB | ~$0.03 |
| CloudFront | 10GB 전송 | ~$1 |
| Route 53 | 1 Hosted Zone | $0.50 |
| **합계** | | **~$10-25/월** |

### 비용 절감 팁

1. **Reserved Instance**: 1년 약정 시 ~30% 할인
2. **Spot Instance**: 개발/테스트 환경에서 ~70% 할인
3. **CloudFront**: PriceClass_100 사용 시 비용 절감 (아시아 제외)

---

## 확장 계획

| 단계 | 변경 사항 | 시기 |
|------|----------|------|
| Phase 2 | EC2 t3.small 업그레이드 | 사용자 100+ |
| Phase 3 | RDS db.t3.small, Multi-AZ | 사용자 500+ |
| Phase 4 | ALB + Auto Scaling Group | 사용자 1000+ |
| Phase 5 | ECS Fargate 마이그레이션 | 사용자 5000+ |

---

## 롤백 절차

### Backend 롤백

```bash
ssh -i ~/.ssh/threadcast-key.pem ec2-user@<ELASTIC_IP> << 'EOF'
sudo systemctl stop threadcast
mv /home/ec2-user/threadcast/threadcast-server.jar.backup \
   /home/ec2-user/threadcast/threadcast-server.jar
sudo systemctl start threadcast
EOF
```

### Frontend 롤백

```bash
# 이전 버전 S3에서 복원 (버저닝 활성화된 경우)
aws s3api list-object-versions --bucket threadcast-web-prod --prefix index.html

# 또는 이전 빌드 재배포
git checkout <previous-commit>
./deploy-frontend.sh
```

---

## 연락처

문제 발생 시:
- GitHub Issues: https://github.com/devload/threadcast/issues
- Email: devload@naver.com
