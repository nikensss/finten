build:
	docker build -f deploy/dockerfiles/Dockerfile -t jarvisdb:latest deploy

kill:
	docker stop jarvis_container

awake:
	docker run --privileged --rm --name jarvis_container -p 3000:3000 jarvisdb:latest