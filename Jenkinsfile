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
        stage('SonarQube Validate code') {
            steps {
                script {
                    docker.image('sonarsource/sonar-scanner-cli').inside {
                        withSonarQubeEnv('SonarServer') {                             
                            sh "sonar-scanner -Dsonar.projectKey=${env.JOB_NAME} -Dsonar.sources=."
                        }
                    }
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "Pipeline abortado: Calidad insuficiente (Status: ${qg.status})"
                        }
                    }                                        
                }
            }
        }
        stage('Build Docker Image') {
            steps {                
                sh 'docker build -t node-api-test-image:latest .'
            }
        }
        stage('Deploy API') {
            steps {
                script {
                    def containerName = (BRANCH_NAME == 'main') ? 'node-api-test-prod' : 'node-api-test-develop'
                    def hostPort = (BRANCH_NAME == 'main') ? '3000' : '4000'

                    sh "docker rm -f ${containerName} || true"                
                    sh "docker run -d --name ${containerName} -p ${hostPort}:3000 -e DATABASE_URL=${DATABASE_URL} node-api-test-image:latest"
                }
            }
        }
    }
    
    
    post {
        always {
            slackSend (
                //tokenCredentialId: 'slack-webhook-url', // Use the ID directly
                channel: '#devops-alerts',
                message: "El pipeline '${env.JOB_NAME}' (${env.BRANCH_NAME}) ha terminado con estado: ${currentBuild.currentResult}."
            )
        }
        failure {
            script {
                // We calculate the author here inside the script block
                def commitAuthor = sh(script: 'git log -1 --pretty=format:"%an <%ae>"', returnStdout: true).trim()
                echo "ATENCIÓN: El pipeline falló. Notificando a: ${commitAuthor}"
                
                slackSend (
                    //tokenCredentialId: 'slack-webhook-url',
                    channel: '#devops-alerts',
                    message: "🚨 ¡ERROR! El pipeline '${env.JOB_NAME}' (${env.BRANCH_NAME}) ha fallado en ${env.BUILD_URL}. Autor: ${commitAuthor}",
                    color: 'danger'
                )
            }
        }
        success {
            echo "Despliegue exitoso. ¡Buen trabajo!"
            slackSend (
                //tokenCredentialId: 'slack-webhook-url',
                channel: '#devops-alerts',
                message: "✅ ÉXITO: El pipeline '${env.JOB_NAME}' (${env.BRANCH_NAME}) se ha completado correctamente en ${env.BUILD_URL}.",
                color: 'good'
            )
        }
    }
}