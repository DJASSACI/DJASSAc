# TODO - Djassa CI - Corrections en cours

## Problèmes résolus:
- ✅ Correction de la restauration du token lors du chargement de la page
- ✅ Amélioration de la gestion des erreurs dans la fonction de publication (vendre) - Détection des erreurs de token et message en français

## Problèmes restants à résoudre:

### Backend (server.js):
- [ ] 1. Rendre le login plus flexible - accepter email et numéro de téléphone
- [ ] 2. Gérer correctement la comparaison des mots de passe (hacher les mots de passe en plaintext)
- [ ] 3. Rendre la création de produit plus flexible - accepter le champ `vendeur` optionnel

### Note sur l'erreur "Invalid or expired token":
Cette erreur signifie que le token JWT a expiré (durée de 7 jours). Le token est stocké dans localStorage. Pour publier un article:
1. Connectez-vous à nouveau
2. Le nouveau token sera généré

### Solution permanente (à implémenter):
- [ ] Implémenter le rafraîchissement du token (token refresh)
- [ ] Stocker le token avec sa date d'expiration
- [ ] Vérifier l'expiration du token côté client avant d'envoyer la requête
