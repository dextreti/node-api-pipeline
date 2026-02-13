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
                //cleanWs()
                //cleanWs deleteDirs: true, notFailBuild: true
                //sh 'rm -rf *'
                sh 'find . -mindepth 1 -delete'   
                // 2. DESCARGAMOS el código (esto es lo que faltó)
                checkout scm             
                // Guardamos el resultado del checkout en una variable
                // script {
                //     def scmInfo = checkout scm
                //     // Extraemos la rama de forma manual y segura
                //     env.ACTUAL_BRANCH = scmInfo.GIT_BRANCH.replace('origin/', '')
                //     echo "Rama detectada con éxito: ${env.ACTUAL_BRANCH}"
                // }
            }
        }
        //version-6
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
                    sh 'npm install sonarqube-scanner --save-dev'
                    sh 'npx prisma generate'
                    
                    withSonarQubeEnv('SonarServer') {
                        sh "npx sonar-scanner \
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
                //expression { env.ACTUAL_BRANCH == 'develop' }
                anyOf {
                    branch 'develop'
                    changeRequest() 
                    // expression { env.GIT_BRANCH?.contains('develop') }
                    //expression { env.BRANCH_NAME == 'develop' || env.GIT_BRANCH?.contains('develop') }                
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
            //cleanWs deleteDirs: true, notFailBuild: true
            //sh 'find . -maxdepth 1 -not -name "." -exec rm -rf {} +'
            cleanWs(
                deleteDirs: true,            // Borra directorios
                notFailBuild: true,          // Que no falle el build si no puede borrar algo
                patterns: [
                    [pattern: '**/.*', type: 'INCLUDE'] // Incluye archivos ocultos
                ]
            )
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