node {
  deleteDir()
  checkout scm

  def app = docker.image("node:7")
  stage('install dependencies') {
    app.inside {
      sh "npm install"
    }
  }

  stage('tests') {
    app.inside {
      sh "npm test"
    }
  }

  deleteDir()
}
