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
                // Este paso SIEMPRE se ejecuta para bloquear el botón de Merge en cualquier rama
                step([$class: 'GitHubCommitStatusSetter', 
                     contextSource: [$class: 'DefaultCommitContextSource', context: 'node-api-branch-develop'],
                     statusResultSource: [$class: 'ConditionalStatusResultSource', 
                         results: [[$class: 'AnyBuildResult', message: 'Jenkins analizando calidad...', state: 'PENDING']]
                     ]
                ])
            }
        }
        
        stage('Node Tasks & Sonar') {
            // Esto se ejecuta para TODOS los programadores
            steps {
                sh 'npm install'
                script {
                    docker.image('sonarsource/sonar-scanner-cli').inside {
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

        stage('Build & Tag Docker Image') {
            when {
                // SEGURIDAD: Solo se construye imagen si es la rama de integración
                branch 'develop'
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${DOCKER_TAG} ."                
                sh "docker tag ${IMAGE_NAME}:${DOCKER_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy API') {
            when {
                // SEGURIDAD: Solo se despliega si es develop
                branch 'develop'
            }
            steps {
                script {
                    sh "docker rm -f node-api-test-develop || true"                
                    sh "docker run -d --name node-api-test-develop -p 4000:3000 -e DATABASE_URL=${DATABASE_URL} ${IMAGE_NAME}:${DOCKER_TAG}"
                }
            }
        }
    }
    
    post {        
        always {
            // Reporta el resultado final (SUCCESS o FAILURE) a GitHub para liberar o bloquear el botón
            step([$class: 'GitHubCommitStatusSetter', 
                 contextSource: [$class: 'DefaultCommitContextSource', context: "node-api-branch-develop"],
                 statusResultSource: [$class: 'ConditionalStatusResultSource', 
                     results: [[$class: 'BetterBuildResult', message: 'Análisis finalizado']]
                 ]
            ])
        }
    }
}