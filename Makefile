build:
	
	DOCKER_BUILDKIT=1 docker build --ssh github="$(HOME)/.ssh/id_rsa" . --no-cache --progress=plain -t finten:latest