# RoomNest - Complete AWS Deployment Guide

## Overview
This guide covers deploying RoomNest on AWS with all components.

---

## AWS Services Required

| Service | Purpose | Cost (approx) |
|---------|---------|---------------|
| EC2 (t3.small) | Run Node.js app | ~$15/month |
| RDS PostgreSQL | Database | ~$15/month |
| S3 | Image storage | ~$5/month |
| ACM | Free SSL certificate | Free |

**Total: ~$35/month**

---

## STEP 1: Database Setup on AWS RDS

### 1.1 Create RDS PostgreSQL Instance
1. AWS Console → RDS → Create Database
2. Engine: **PostgreSQL 16**
3. Template: Free tier or Production
4. DB identifier: `roomnest-db`
5. Master username: `roomnest`
6. Master password: (set a strong password)
7. Instance class: `db.t3.micro` (free) or `db.t3.small`
8. Storage: 20 GB gp2
9. Public access: **YES** (for initial restore, disable after)
10. Security group: Allow port **5432**

### 1.2 Restore Database
```bash
# Run from your local machine or EC2:
psql -h YOUR-RDS-ENDPOINT -U roomnest -d postgres -c "CREATE DATABASE roomnest;"
psql -h YOUR-RDS-ENDPOINT -U roomnest -d roomnest < roomnest_aws_database_backup.sql
```

### 1.3 Your DATABASE_URL
```
postgresql://roomnest:YOUR_PASSWORD@YOUR-RDS-ENDPOINT.rds.amazonaws.com:5432/roomnest
```

---

## STEP 2: Image Storage on AWS S3

### 2.1 Image Situation
Your photos are 2 types:
- **Unsplash URLs** (IDs 37-47): External URLs — work everywhere, NO migration needed
- **Google Cloud Storage URLs** (IDs 57-77): Stored in Replit's private GCS bucket — need migration to S3

### 2.2 Create S3 Bucket
1. S3 → Create bucket → name: `roomnest-photos`
2. Uncheck "Block all public access" (images need to be public)
3. Add bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::roomnest-photos/*"
  }]
}
```

### 2.3 After Uploading Images to S3, Update DB
```sql
UPDATE universal_photos
SET photo_url = REPLACE(photo_url,
  'https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private',
  'https://roomnest-photos.s3.amazonaws.com')
WHERE photo_url LIKE '%storage.googleapis.com/replit-objstore%';
```

---

## STEP 3: EC2 Server Setup

### 3.1 Launch EC2 Instance
1. EC2 → Launch Instance
2. Name: `roomnest-app`
3. AMI: **Ubuntu Server 22.04 LTS**
4. Type: `t3.small` (2 vCPU, 2GB RAM)
5. Security group ports: **22** (SSH), **80** (HTTP), **443** (HTTPS)

### 3.2 Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

### 3.3 Install Node.js 20 + PM2 + Nginx
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### 3.4 Upload Source Code (from your local machine)
```bash
# Download zip from Replit, then upload:
scp -i your-key.pem roomnest.zip ubuntu@YOUR-EC2-IP:/home/ubuntu/
ssh ubuntu@YOUR-EC2-IP "unzip roomnest.zip -d /var/www/roomnest"
```

### 3.5 Configure Environment
```bash
cd /var/www/roomnest
nano .env
```
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://roomnest:PASSWORD@YOUR-RDS-ENDPOINT:5432/roomnest
SESSION_SECRET=your-very-long-random-secret-key-minimum-32-characters
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### 3.6 Install & Build
```bash
cd /var/www/roomnest
npm install
npm run build
```

### 3.7 Start with PM2
```bash
pm2 start "node dist/index.js" --name roomnest
pm2 startup
pm2 save
```

---

## STEP 4: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/roomnest
```
```nginx
server {
    listen 80;
    server_name booking.microgenn.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/roomnest /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## STEP 5: Free SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d booking.microgenn.com
```

---

## STEP 6: Point Domain to EC2

In BigRock DNS, update the A record:
- Host: `booking`
- Points to: **YOUR EC2 PUBLIC IP**

---

## Can Replit Connect to AWS RDS? YES!

You can keep developing on Replit while your database runs on AWS RDS:

1. In Replit Secrets → update `DATABASE_URL` to your AWS RDS connection string
2. In AWS RDS security group → allow inbound port **5432** from `0.0.0.0/0`
3. Replit dev environment and AWS production will **share the same database**

**Result:**
- Develop on Replit → data saved to AWS RDS
- Production on AWS EC2 → same AWS RDS database
- booking.microgenn.com → EC2 → RDS

---

## Database Contents (what's in the backup)

| Table | Records |
|-------|---------|
| properties | 9 |
| bookings | 52 |
| users | 5 |
| universal_photos | 31 |
| room_types | multiple |
| rate_master | multiple |
| + 36 other tables | - |

---

## Default Login Credentials
- **Admin login**: username `admin` / password `password`
- **Admin URL**: https://booking.microgenn.com/admin

---

## Files in This Package
- `roomnest_aws_database_backup.sql` — Full PostgreSQL dump with all data
- `AWS_DEPLOYMENT_GUIDE.md` — This guide
- All source code files
