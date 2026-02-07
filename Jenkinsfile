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
                            //sh "sonar-scanner -Dsonar.projectKey=node-api-northwind -Dsonar.sources=. -Dsonar.qualitygate.wait=true"
                            // Esto asegura que cada rama tenga su propio espacio en SonarQube
                            //sh "sonar-scanner -Dsonar.projectKey=node-api-branch-${env.BRANCH_NAME} -Dsonar.sources=."
                            sh "sonar-scanner -Dsonar.projectKey=node-api-branch-develop -Dsonar.sources=."
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
                    // Definimos variables según la rama
                    def containerName = (BRANCH_NAME == 'main') ? 'node-api-test-prod' : 'node-api-test-develop'
                    def hostPort = (BRANCH_NAME == 'main') ? '3000' : '4000'

                    // Detenemos y borramos el contenedor anterior si existe
                    sh "docker rm -f ${containerName} || true"

                    // Corremos el nuevo contenedor con el puerto específico                    
                    //sh "docker run -d --name ${containerName} -p ${hostPort}:3000 node-api-test-image:latest"                    
                    sh "docker run -d --name ${containerName} -p ${hostPort}:3000 -e DATABASE_URL=${DATABASE_URL} node-api-test-image:latest"
                }
            }
    }
    }
    post {
        failure {
            script {
                // Obtenemos el autor del commit para saber debe resolver
                def commitAuthor = sh(script: 'git log -1 --pretty=format:"%an <%ae>"', returnStdout: true).trim()
                echo "ATENCIÓN: El pipeline falló. Notificando a: ${commitAuthor}"
                
                // Aquí podrías integrar un comando de mail o slack
                // emailext (to: "${commitAuthor}", subject: "Bug detectado en SonarQube", body: "Revisa el análisis...")
            }
        }
        success {
            echo "Despliegue exitoso. ¡Buen trabajo!"
        }
    }
        
}