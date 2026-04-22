# Kubernetes Manifests (stub)

ACH-025 performance-escalabilidade follow-up. Fill in once the target
cluster is chosen (EKS / GKE / Railway / Fly).

Target manifests:

- `deployment-web.yaml` — 2 replicas, HPA, PDB.
- `deployment-worker.yaml` — 2 replicas, KEDA scaler on queue depth.
- `service-*.yaml` — ClusterIP + Ingress.
- `hpa-web.yaml`, `hpa-worker.yaml` — CPU + custom metrics.
- `pdb-*.yaml` — `minAvailable: 1`.
- `secret-*.yaml` — sealed-secrets / external-secrets config.

Keep the stubs under version control; populate when the cluster
flavour is chosen.
