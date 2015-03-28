#!/bin/sh
apt-get update -y -q
sudo apt-get install redis-server
sudo sed -i "s/bind 127.0.0.1/bind 0.0.0.0/g" /etc/redis/redis.conf
sudo service redis-server restart