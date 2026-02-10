pipeline {
    agent any
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        // Definimos la base una sola vez para evitar repeticiones
        SLACK_BASE_URL="https://hooks.slack.com/services/"
    }    
    stages {
        // ... (Tus stages se mantienen igual)
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
    }
    
    post {
        failure {
            script {
                // Obtenemos el autor antes de entrar al envío de Slack
                def commitAuthor = sh(script: 'git log -1 --pretty=format:"%an <%ae>"', returnStdout: true).trim()
                
                slackSend (
                    baseUrl: "${env.SLACK_BASE_URL}",
                    tokenCredentialId: 'token-slack',
                    channel: '#devops-alerts',
                    color: 'danger',
                    message: "🚨 ¡ERROR! El pipeline '${env.JOB_NAME}' falló. Autor: ${commitAuthor}. Ver: ${env.BUILD_URL}"
                )
            }
        }
        success {
            slackSend (
                baseUrl: "${env.SLACK_BASE_URL}",
                tokenCredentialId: 'token-slack',
                channel: '#devops-alerts',
                color: 'good',
                message: "✅ ÉXITO: El pipeline '${env.JOB_NAME}' se completó correctamente."
            )
        }
    }
}