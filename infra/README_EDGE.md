# Edge (Nginx) Kurulumu — siyahkare.com

1) EC2 güvenlik grubu: 80/443 açık, 22 sınırlı.
2) DNS: subdomainler EC2 IP’ye işaret etsin.
3) Docker ağ: `docker network create proxy_net`
4) Nginx proxy:
   - `infra/nginx-proxy/docker-compose.nginx.yml`
   - `infra/nginx-proxy/conf.d/*.conf`
5) Sertifika ilk alma (webroot): her domain için certbot `certonly --webroot`.
6) Çalıştırma: `docker compose -f infra/nginx-proxy/docker-compose.nginx.yml up -d`.
7) Uygulama stack’lerini `proxy_net`e bağlayın; upstream isimleri Nginx conf ile eşleşsin.




