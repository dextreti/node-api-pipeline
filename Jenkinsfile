pipeline {
    agent any 
    options {        
        disableConcurrentBuilds() 
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
        skipDefaultCheckout()
    }
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        DOCKER_TAG = "b${env.BUILD_NUMBER}"
        IMAGE_NAME = "node-api-test-image"
        SONAR_HOST_URL = "http://192.168.0.31:9000"        
        SONAR_AUTH_TOKEN = credentials('SONAR_TOKEN')
    }    
    stages {
        stage('Checkout') {
            steps {
                cleanWs()
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

        stage('Calidad y Sonar') {
            agent {
                docker {
                    image 'node-api-agent:latest' 
                    // Combinamos argumentos: Usuario 1000, grupo docker 999 y montamos el socket
                    args '-u 1000:1000 --group-add 999 -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                script {
                    sh 'npm install' 
                    sh 'npx prisma generate'

                    withSonarQubeEnv('SonarServer') {
                        // Eliminamos npx porque sonar-scanner ya es global en tu imagen
                        sh "sonar-scanner \
                            -Dsonar.projectKey=node-api-branch-develop \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_AUTH_TOKEN}"
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
                    branch 'develop'
                    expression { env.GIT_BRANCH?.contains('develop') }
                    expression { env.CHANGE_TARGET == 'develop' } // Para Pull Requests a develop
                }
            }
            steps {
                // Importante: DATABASE_URL se pasa con comillas simples en el -e para evitar errores de escape
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