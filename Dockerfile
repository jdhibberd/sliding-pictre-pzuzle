FROM ubuntu:latest
RUN apt-get -y update
RUN apt-get -y install git
RUN git config --global user.email "james.d.hibberd@gmail.com"
RUN git config --global user.name "James Hibberd"