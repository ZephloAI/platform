sudo kubectl create secret generic db-credentials \
    -n agent-saas \
    --from-literal=POSTGRES_USER=flunkieadm \
    --from-literal=POSTGRES_PASSWORD='hYJIk84T0uE' \
    --from-literal=POSTGRES_DB=agent_saas \
    --from-literal=DATABASE_URL='postgresql+asyncpg://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas' \
    --from-literal=DATABASE_URL_SYNC='postgresql+psycopg://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas' \
    --from-literal=DATABASE_URL_ASYNCPG='postgresql://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas'


sudo kubectl create secret generic db-credentials \
    -n agent-saas \
    --from-literal=POSTGRES_USER=flunkieadm \
    --from-literal=POSTGRES_PASSWORD='hYJIk84T0uE' \
    --from-literal=POSTGRES_DB=agent_saas \
    --from-literal=DATABASE_URL='postgresql+asyncpg://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas' \
    --from-literal=DATABASE_URL_SYNC='postgresql+psycopg://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas' \
    --from-literal=DATABASE_URL_ASYNCPG='postgresql://flunkieadm:hYJIk84T0uE@postgres:5432/agent_saas'

  # Application secrets
  sudo kubectl create secret generic app-secrets \
    -n agent-saas \
    --from-literal=JWT_SECRET='Hj1uJjZLMr9mT3cyRv' \
    --from-literal=JWT_ALGORITHM=HS256 \
    --from-literal=JWT_EXPIRE_MINUTES=1440 \
    --from-literal=OPENROUTER_API_KEY='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' \
    --from-literal=LLM_MODEL='google/gemini-3-flash-preview' \
    --from-literal=OPENROUTER_MODEL='google/gemini-3-flash-preview' \
    --from-literal=ELEVEN_LABS_API_KEY='sk_97d75efebba2be48540cfdb8e4212c4939eb6885c7348809' \
    --from-literal=ELEVEN_LABS_VOICE_ID='UgBBYS2sOqTuMpoF3BR0' \
    --from-literal=ELEVEN_LABS_MODEL_ID='eleven_multilingual_v2'

  # AWS credentials (skip if not using S3)
  sudo kubectl create secret generic aws-credentials \
    -n agent-saas \
    --from-literal=AWS_ACCESS_KEY_ID=AKIA45L22SX7ACDMA7N7 \
    --from-literal=AWS_SECRET_ACCESS_KEY=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 \
    --from-literal=S3_BUCKET_NAME=llymabuck \
    --from-literal=AWS_REGION=me-south-1

  # Docker Hub pull secret
  sudo kubectl create secret docker-registry dockerhub-pull-secret \
    -n agent-saas \
    --docker-server=https://index.docker.io/v1/ \
    --docker-username=ikithinji \
    --docker-password='dckr_pat_Dm0vyeI346yy0drYjyGUHqfyr-k' \
    --docker-email='innocentkithinji9@gmail.com'


sudo kubectl rollout restart deployment -n agent-saas && sudo kubectl delete job --all -n agent-saas && sudo kubectl apply -k /tmp/k8s/overlays/production

sudo kubectl delete job --all -n agent-saas && sudo kubectl rollout restart deployment -n agent-saas && sudo kubectl apply -k /tmp/k8s/overlays/production
  sudo kubectl get pods -n agent-saas -w

sudo kubectl exec postgres-0 -n agent-saas -- psql -U flunkieadm -l

sudo kubectl exec postgres-0 -n agent-saas -- psql -U flunkieadm -d postgres -c "CREATE DATABASE agent_saas;"

sudo kubectl logs agent-5bdbdcfd7d-d7866 -n agent-saas --tail=30

sudo kubectl logs agent-58fc8c85bd-6nb9t -n agent-saas --tail=30


sudo kubectl apply -k /tmp/k8s/overlays/production && sudo kubectl rollout restart deployment agent -n agent-saas

sudo kubectl describe pod agent-68f459fc6-blrvc -n agent-saas | grep -E "State|Reason|Exit|OOM|Last"

sudo kubectl logs agent-68f459fc6-blrvc -n agent-saas --previous

sudo kubectl exec -it agent-57d5884f8d-lkxdv -n agent-saas -- env | grep -E "DATABASE|QDRANT|OPENROUTER|LLM|API_CALLBACK"

sudo kubectl logs agent-789ccc777f-gq2rr -n agent-saas --previous 2>/dev/null || sudo kubectl logs agent-5c79b7f686-mqf99 -n agent-saas --previous


sudo kubectl top nodes 2>/dev/null; echo "---"; sudo kubectl describe node vmi3182479 | grep -A 5 "Allocated resources"