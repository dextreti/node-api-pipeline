pipeline {
    agent any
    options {
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
    }
    environment {        
        DATABASE_URL="postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
        SLACK_BASE_URL="https://hooks.slack.com/services/"
        DOCKER_TAG = "b${env.BUILD_NUMBER}"
        IMAGE_NAME = "node-api-test-image"
    }    
    stages {
        stage('Initialize GitHub Status') {
            steps {
                
                step([$class: 'GitHubCommitStatusSetter', 
                     contextSource: [$class: 'DefaultCommitContextSource', context: 'node-api-branch-develop'],
                     statusResultSource: [$class: 'ConditionalStatusResultSource', 
                         results: [[$class: 'AnyBuildResult', message: 'Jenkins está analizando la calidad...', state: 'PENDING']]
                     ]
                ])
            }
        }
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
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    docker.image('sonarsource/sonar-scanner-cli').inside {
                        withSonarQubeEnv('SonarServer') {
                            def sonarArgs = "-Dsonar.projectKey=${env.JOB_NAME} -Dsonar.sources=."
                            if (env.CHANGE_ID) {
                                sonarArgs += " -Dsonar.pullrequest.key=${env.CHANGE_ID}"
                                sonarArgs += " -Dsonar.pullrequest.branch=${env.CHANGE_BRANCH}"
                                sonarArgs += " -Dsonar.pullrequest.base=${env.CHANGE_TARGET}"
                            }
                            sh "sonar-scanner ${sonarArgs}"
                        }
                    }
                    timeout(time: 5, unit: 'MINUTES') {
                        
                        waitForQualityGate abortPipeline: true
                    }                                        
                }
            }
        }

        stage('Build & Tag Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."                
                sh "docker tag ${IMAGE_NAME}:${DOCKER_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy API') {
            steps {
                script {
                    def containerName = (env.BRANCH_NAME == 'main') ? 'node-api-test-prod' : 'node-api-test-develop'
                    def hostPort = (env.BRANCH_NAME == 'main') ? '3000' : '4000'

                    sh "docker rm -f ${containerName} || true"                
                    sh "docker run -d --name ${containerName} -p ${hostPort}:3000 -e DATABASE_URL=${DATABASE_URL} ${IMAGE_NAME}:${DOCKER_TAG}"
                }
            }
        }
    }
    
    post {        
        always {
            
            step([$class: 'GitHubCommitStatusSetter', 
                 contextSource: [$class: 'DefaultCommitContextSource', context: "node-api-branch-develop"],
                 statusResultSource: [$class: 'ConditionalStatusResultSource', 
                     results: [[$class: 'BetterBuildResult', message: 'Análisis de calidad completado']]
                 ]
            ])
        }
        failure {
            script {
                def commitAuthor = sh(script: 'git log -1 --pretty=format:"%an <%ae>"', returnStdout: true).trim()
                slackSend (
                    baseUrl: "${env.SLACK_BASE_URL}",
                    tokenCredentialId: 'token-slack',
                    channel: '#devops-alerts',
                    color: 'danger',
                    message: "🚨 ¡BLOQUEADO! Build #${env.BUILD_NUMBER} falló. Autor: ${commitAuthor}. Revisar PR: ${env.CHANGE_URL ?: env.BUILD_URL}"
                )
            }
        }
        success {
            slackSend (
                baseUrl: "${env.SLACK_BASE_URL}",
                tokenCredentialId: 'token-slack',
                channel: '#devops-alerts',
                color: 'good',
                message: "✅ ÉXITO: Build #${env.BUILD_NUMBER} desplegado con tag ${DOCKER_TAG}."
            )
        }
    }
}