pipeline {
    agent any
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
    }    
    stages {
        stage('Node Tasks') {
            agent {
                docker {
                    image 'node:22-bookworm-slim' 
                    args '-v /var/run/docker.sock:/var/run/docker.sock --user root'
                }
            }            
            steps {
                sh 'npm install'
                sh 'npx prisma generate'
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