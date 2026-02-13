pipeline {
    agent any
    options {
        disableConcurrentBuilds()
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
        skipDefaultCheckout()
    }
    environment {
        DATABASE_URL = "postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        DOCKER_TAG    = "b${env.BUILD_NUMBER}"
        IMAGE_NAME    = "node-api-test-image"
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
                    args '--user root'
                }
            }
            steps {
                script {
                    sh 'npm install'
                    sh 'npx prisma generate'

                    // SonarQube simplificado
                    withSonarQubeEnv('SonarServer') {
                        sh """
                        sonar-scanner \
                            -Dsonar.projectKey=node-api-branch-develop \
                            -Dsonar.sources=.
                        """
                    }

                    // Quality Gate
                    timeout(time: 10, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Build & Deploy') {
            when { branch 'develop' }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
                
                // Detener y eliminar container si existe
                sh "docker rm -f node-api-test-develop || true"
                
                // Ejecutar container con reinicio automático
                sh """
                docker run -d \
                    --name node-api-test-develop \
                    -p 4000:3000 \
                    -e DATABASE_URL='${env.DATABASE_URL}' \
                    --restart unless-stopped \
                    ${IMAGE_NAME}:${DOCKER_TAG}
                """
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
