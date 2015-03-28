# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
    config.vm.provision :shell, :path => "vagrant_bootstrap.sh"

    config.vm.define "test" do |one|
        one.vm.box = "Official Ubuntu 12.04 daily Cloud Image amd64 (VirtualBox 4.1.12)"
        one.vm.box_url = "http://cloud-images.ubuntu.com/vagrant/precise/current/precise-server-cloudimg-amd64-vagrant-disk1.box"
        one.vm.network :forwarded_port, guest: 22, host: 2222, id: "ssh"
        one.vm.network :forwarded_port, guest: 6379, host: 1234, id: "redis"
    end
end