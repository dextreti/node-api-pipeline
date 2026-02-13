pipeline {
    agent any 
    options {        
        disableConcurrentBuilds() 
        githubProjectProperty(projectUrlStr: 'https://github.com/dextreti/node-api-pipeline/')
        skipDefaultCheckout()
    }
    environment {        
        DATABASE_URL = "postgresql://postgres:postgres@192.168.0.31:55432/northwind?schema=public"
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
        //version-3
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
                    reuseNode true
                    args '-u root -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/volumes/dextre_jenkins_home/_data:/var/jenkins_home'
                }
            }
            steps {
                script {
                    sh 'npm install' 
                    sh 'npx prisma generate'

                    withSonarQubeEnv('SonarServer') {                        
                        sh "chmod +x /usr/local/bin/sonar-scanner || chmod +x /usr/local/lib/node_modules/sonar-scanner/bin/sonar-scanner"
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
                }
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."
                sh "docker rm -f node-api-test-develop || true"                
                sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL='${env.DATABASE_URL}' ${IMAGE_NAME}:${DOCKER_TAG}"
            }
        }      
    }  

    post {        
        always {
            cleanWs() // Borrar todo (node_modules, temporales) al terminar el build
        }
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