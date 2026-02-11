pipeline {
    agent any 
    options {
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
        skipDefaultCheckout() // Evitamos doble checkout para ganar velocidad
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
                // Simplificamos la notificación para evitar errores de clases no encontradas
                step([$class: 'GitHubCommitStatusSetter',
                    contextSource: [$class: 'DefaultCommitContextSource', context: "jenkins/pipeline"],
                    statusResultSource: [$class: 'ConditionalStatusResultSource', 
                        results: [[$class: 'AnyBuildResult', message: 'Analizando código...', state: 'PENDING']]
                    ]
                ])
            }
        }
        
        stage('Calidad & Sonar') {
            steps {
                script {
                    // Ejecutamos TODO lo de Node dentro del contenedor para que encuentre 'npm'
                    docker.image('node:22-bookworm-slim').inside("--user root") {
                        sh 'npm install'
                        sh 'npx prisma generate'
                    }
                    
                    // Escaneo de Sonar
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

        // stage('Build & Deploy') {
        //     when { 
        //         expression { env.ghprbTargetBranch == 'develop' || env.GIT_BRANCH.contains('develop') } 
        //     }
        //     steps {
        //         sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
        //         sh "docker rm -f node-api-test-develop || true"                
        //         sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL=${DATABASE_URL} ${IMAGE_NAME}:${DOCKER_TAG}"
        //     }
        // }
        stage('Build & Deploy') {
            when { 
                expression { 
                    env.ghprbTargetBranch == 'develop' || (env.GIT_BRANCH && env.GIT_BRANCH.contains('develop')) 
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
        always {
            step([$class: 'GitHubCommitStatusSetter',
                contextSource: [$class: 'DefaultCommitContextSource', context: "jenkins/pipeline"],
                statusResultSource: [$class: 'ConditionalStatusResultSource', 
                    results: [[$class: 'AnyBuildResult', message: 'Pipeline finalizado']]
                ]
            ])
        }
    }
}