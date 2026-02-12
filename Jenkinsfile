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
                // MODIFICACIÓN: Se cambió 'DefaultCommitContextSource' por 'ManuallyEnteredCommitContextSource'
                // para evitar el error de "Unknown parameter context" y forzar la sincronización con GitHub.
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
                    docker.image('node:22-bookworm-slim').inside("--user root") {
                        sh 'npm install'
                        sh 'npx prisma generate'
                    }
                    
                    docker.image('sonarsource/sonar-scanner-cli').inside("--user root") {
                        withSonarQubeEnv('SonarServer') {
                            sh "sonar-scanner -Dsonar.projectKey=${env.JOB_NAME} -Dsonar.sources=."
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
                allOf {
                    // Solo si la rama es exactamente develop
                    branch 'develop' 
                    // Y solo si NO es un Pull Request analizado por el plugin
                    expression { env.ghprbPullId == null } 
                }
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
                sh "docker rm -f node-api-test-develop || true"                
                sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL=${DATABASE_URL} ${IMAGE_NAME}:${DOCKER_TAG}"
            }
        }
    }  

    post {        
        success {
            // Solo si todo salió bien, enviamos el verde a GitHub
            step([$class: 'GitHubCommitStatusSetter',
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: "node-api-branch-develop"],
                statusResultSource: [$class: 'ConditionalStatusResultSource', 
                    results: [[$class: 'AnyBuildResult', message: '¡Calidad perfecta! Botón habilitado', state: 'SUCCESS']]
                ]
            ])
        }
        failure {
            // Si algo falló, nos aseguramos de que GitHub lo sepa
            step([$class: 'GitHubCommitStatusSetter',
                contextSource: [$class: 'ManuallyEnteredCommitContextSource', context: "node-api-branch-develop"],
                statusResultSource: [$class: 'ConditionalStatusResultSource', 
                    results: [[$class: 'AnyBuildResult', message: 'Error en el pipeline o calidad', state: 'FAILURE']]
                ]
            ])
        }
    }
    
}