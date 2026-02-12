pipeline {
    agent any 
    options {
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
        skipDefaultCheckout() 
    }
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        DOCKER_TAG = "b${env.BUILD_NUMBER}"
        IMAGE_NAME = "node-api-test-image"
    }    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Status Inicial') {
            steps {
                step([$class: 'GitHubCommitStatusSetter',
                    contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: "node-api-branch-develop"],
                    statusResultSource: [$class: 'ConditionalStatusResultSource', 
                        results: [[$class: 'AnyBuildResult', message: 'Analizando código...', state: 'PENDING']]
                    ]
                ])
            }
        }
        
        stage('Calidad & Sonar') {
            steps {
                script {
                    // Solución para Prisma: Instalamos openssl explícitamente en el contenedor
                    docker.image('node:22-bookworm-slim').inside("--user root") {
                        sh 'apt-get update && apt-get install -y openssl'
                        sh 'npm install'
                        sh 'npx prisma generate'
                    }
                    
                    // Solución Error 126: Usamos la imagen oficial de SonarSource directamente
                    docker.image('sonarsource/sonar-scanner-cli').inside("--user root") {
                        withSonarQubeEnv('SonarServer') {
                            sh "sonar-scanner -Dsonar.projectKey=node-api-branch-develop -Dsonar.sources=."
                        }
                    }
                    
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }                                        
                }
            }
        }

        stage('Build & Deploy') {            
             when { 
                anyOf {
                    expression { env.ghprbTargetBranch == 'develop' }
                    branch 'develop'
                    expression { env.GIT_BRANCH?.contains('develop') }
                }
            }
            steps {
                // Usamos comillas simples para DATABASE_URL para evitar que el shell interprete caracteres especiales
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
                sh "docker rm -f node-api-test-develop || true"                
                sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL='${env.DATABASE_URL}' ${IMAGE_NAME}:${DOCKER_TAG}"
            }
        }      
    }  

    post {        
        success {
            step([$class: 'GitHubCommitStatusSetter',
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: "node-api-branch-develop"],
                statusResultSource: [$class: 'ConditionalStatusResultSource', 
                    results: [[$class: 'AnyBuildResult', message: '¡Calidad perfecta! Despliegue exitoso', state: 'SUCCESS']]
                ]
            ])
        }
        failure {
            step([$class: 'GitHubCommitStatusSetter',
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: "node-api-branch-develop"],
                statusResultSource: [$class: 'ConditionalStatusResultSource', 
                    results: [[$class: 'AnyBuildResult', message: 'Error en el pipeline o calidad', state: 'FAILURE']]
                ]
            ])
        }
    }
}