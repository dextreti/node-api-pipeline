pipeline {
    agent {
        docker {
            image 'node:22-bookworm-slim' 
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    environment {
        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
    }
    stages {
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }
        stage('Prisma Generate') {
            steps {
                
                sh 'npx prisma generate'
            }
        }
        stage('Test & Lint') {
            steps {
                
                sh 'npx prisma validate'
                
            }
        }
        stage('Build Docker Image') {
            steps {
                
                sh 'docker build -t node-api-northwind:latest .'
            }
        }
    }
}