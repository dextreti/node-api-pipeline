pipeline {
    agent any
    options {
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
    }
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        DOCKER_TAG = "b${env.BUILD_NUMBER}"
        IMAGE_NAME = "node-api-test-image"
    }    
    stages {
        stage('Status Inicial') {
            steps {
                step([$class: 'GitHubCommitStatusSetter', 
                     statusResultSource: [$class: 'ConditionalStatusResultSource', 
                         results: [[$class: 'AnyBuildResult', message: 'Analizando...', state: 'PENDING']]
                     ]
                ])
            }
        }
        
        stage('Calidad Node') {
            agent {
                docker {
                    image 'node:22-bookworm-slim' 
                    args '-v /var/run/docker.sock:/var/run/docker.sock --user root'
                }
            }            
            steps {
                sh 'npm install'
                sh 'npx prisma generate'
            }
        }

        stage('SonarQube') {
            steps {
                script {
                    // Solo agregamos --user root para que el contenedor pueda leer tu workspace en Debian
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
        //     when { branch 'develop' }
        //     steps {
        //         sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
        //         sh "docker rm -f node-api-test-develop || true"                
        //         sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL=${DATABASE_URL} ${IMAGE_NAME}:${DOCKER_TAG}"
        //     }
        // }
        stage('Build & Deploy') {
            // Cambiamos la condición para que reconozca el Pull Request hacia develop
            when { 
                expression { env.ghprbTargetBranch == 'develop' || env.GIT_BRANCH == 'origin/develop' } 
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
                 statusResultSource: [$class: 'ConditionalStatusResultSource', 
                     results: [[$class: 'AnyBuildResult', message: 'Análisis finalizado']]
                 ]
            ])
        }
    }
}