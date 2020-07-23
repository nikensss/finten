build:
	docker build -f deploy/dockerfiles/Dockerfile -t jarvisdb:latest deploy
	docker tag jarvisdb:latest eu.gcr.io/finten/jarvisdb:latest
	docker push eu.gcr.io/finten/jarvisdb:latest


kill:
	docker stop jarvis_container

awake:
	docker run --privileged --rm --name jarvis_container -p 3000:3000 eu.gcr.io/finten/jarvisdb:latest