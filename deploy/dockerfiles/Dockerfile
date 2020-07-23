FROM node
USER root

ADD secrets/download_repo.sh download_repo.sh
ADD secrets/init.sh init.sh

ADD secrets/.env .env
ADD secrets/FinTen-12dc27d28725.json FinTen-12dc27d28725.json

ENV GOOGLE_APPLICATION_CREDENTIALS=$PWD/FinTen-12dc27d28725.json

#GFUSE
RUN apt-get update && apt-get install -y lsb-release && apt-get clean all
RUN export GCSFUSE_REPO=gcsfuse-`lsb_release -c -s` \
    && echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

RUN apt-get update \
&& apt-get install -yq gcsfuse

RUN chmod +x download_repo.sh
RUN chmod +x init.sh
RUN ./download_repo.sh
RUN cp .env finten/.env
RUN cd finten && npm i

RUN mkdir finten/gcloud
RUN mkdir finten/gcloud/fintendb
CMD ["./init.sh"]

