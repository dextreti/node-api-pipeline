# enter container directory
docker exec -u root -it 23fadd893715  bash
# public ip
ngrok http 8080
# kill process
kill 22447
# see logs
docker logs -f sonarqube_server
# webhook sonarq    
https://dedicatedly-intermandibular-ike.ngrok-free.dev/sonarqube-webhook/

# check what we can get enviroments variables from options :replay 
pipeline {
    agent any
    stages {
        stage('Diagnóstico de Variables') {
            steps {
                script {
                    echo "--- DEBUG INFO ---"
                    echo "BRANCH_NAME actual es: ${env.BRANCH_NAME}"
                    echo "CHANGE_TARGET (PR Destino) es: ${env.CHANGE_TARGET}"
                    echo "CHANGE_BRANCH (PR Origen) es: ${env.CHANGE_BRANCH}"
                    echo "GIT_BRANCH es: ${env.GIT_BRANCH}"
                    echo "------------------"
                }
            }
        }
    }
}
# other case
pipeline {
    agent any
    stages {
        stage('Validando Condición') {
            when {
                anyOf {
                    expression { env.GIT_BRANCH == 'origin/develop' }
                    branch 'origin/develop'
                }
            }
            steps {
                script {
                    echo "------------------------------------------------"
                    echo "¡ÉXITO! La condición se cumplió."
                    echo "GIT_BRANCH detectada es: ${env.GIT_BRANCH}"
                    echo "------------------------------------------------"
                }
            }
        }
    }
}
# delete files
rm -rf /var/jenkins_home/workspace/node-api-branch-develop*