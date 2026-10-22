# Foxhound AI

Service d'analyse de retours clients pour une application SaaS. L'API regroupe les feedbacks par similarité sémantique, résume chaque thème avec un LLM et attribue un score de priorité de 0 à 100.

## Fonctionnalités

- regroupement sémantique des feedbacks avec `sentence-transformers` et K-Means ;
- génération d'un titre, d'un résumé et d'une éventuelle contradiction avec Groq ;
- score de priorité fondé sur le volume, le nombre d'utilisateurs ou d'entreprises concernés et la récence ;
- API HTTP avec validation des entrées grâce à FastAPI et Pydantic ;
- prise en charge de feedbacks multilingues ;
- limite de 100 feedbacks par analyse.

## Prérequis

- Python 3.12 ;
- une clé API [Groq](https://console.groq.com/keys).

## Installation

Depuis le dossier `apps/ai` :

```bash
python3.12 -m venv venv312
source venv312/bin/activate
pip install -r requirements.txt
```

Sous Windows, activez l'environnement avec :

```powershell
venv312\Scripts\Activate.ps1
```

Le modèle d'embeddings `paraphrase-multilingual-MiniLM-L12-v2` est téléchargé automatiquement au premier démarrage.

## Configuration

Créez un fichier `.env` dans `apps/ai` :

```dotenv
GROQ_API_KEY=votre_cle_api
GROQ_MODEL=openai/gpt-oss-20b
```

`GROQ_MODEL` est facultatif. Sa valeur par défaut est `openai/gpt-oss-20b`.

Ne versionnez jamais le fichier `.env`.

## Démarrage

```bash
python main.py
```

L'API est alors disponible sur `http://127.0.0.1:8000`.

La documentation interactive est accessible aux adresses suivantes :

- Swagger UI : `http://127.0.0.1:8000/docs`
- ReDoc : `http://127.0.0.1:8000/redoc`

Pour activer le rechargement automatique pendant le développement :

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## API

### `POST /analyze`

Analyse une liste de 0 à 100 feedbacks.

#### Corps de la requête

```json
{
  "feedbacks": [
    {
      "id": "fb_001",
      "text": "The dashboard takes more than 12 seconds to load.",
      "createdAt": "2026-10-20T09:15:00Z",
      "userId": "usr_001",
      "companyId": "cmp_001"
    }
  ]
}
```

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `id` | chaîne | oui | Identifiant unique du feedback |
| `text` | chaîne non vide | oui | Contenu à analyser |
| `createdAt` | chaîne ISO 8601 | non | Date utilisée pour mesurer la récence |
| `userId` | chaîne | non | Identifiant de l'utilisateur concerné |
| `companyId` | chaîne | non | Identifiant de l'entreprise concernée |

#### Exemple avec les données fournies

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  --data @data/feedbacks.mock.json
```

#### Réponse

```json
{
  "groups": [
    {
      "title": "Performance du tableau de bord",
      "summary": "Les utilisateurs signalent un chargement lent avec de grands volumes de données.",
      "score": 100,
      "priority": "red",
      "contradiction": null,
      "feedbackIds": ["fb_001"]
    }
  ]
}
```

Les groupes sont triés du score le plus élevé au plus faible. Une liste vide renvoie `{"groups": []}`.

## Calcul de la priorité

Le score est calculé à partir de trois composantes :

| Composante | Poids | Description |
| --- | ---: | --- |
| Volume | 50 % | Taille du groupe par rapport au plus grand groupe |
| Entités | 30 % | Nombre d'utilisateurs et d'entreprises distincts concernés |
| Récence | 20 % | Fraîcheur du dernier feedback du groupe, avec une demi-vie de 30 jours |

Le score final détermine la priorité :

- `green` : de 0 à 33 ;
- `yellow` : de 34 à 66 ;
- `red` : de 67 à 100.

## Architecture

```text
apps/ai/
├── data/
│   └── feedbacks.mock.json  # Données de démonstration
├── main.py                  # API FastAPI et validation des requêtes
├── pipeline.py              # Clustering, analyse LLM et scoring
├── requirements.txt         # Dépendances Python
└── .env                     # Configuration locale non versionnée
```

Le pipeline suit quatre étapes :

1. vectorisation des textes avec un modèle Sentence Transformers multilingue ;
2. regroupement des vecteurs avec K-Means ;
3. génération du titre, du résumé et de la contradiction avec Groq ;
4. calcul du score et tri des groupes par priorité.

## Erreurs courantes

- `422 Unprocessable Entity` : la requête ne respecte pas le schéma attendu ou contient plus de 100 feedbacks ;
- `503 Service Unavailable` : `GROQ_API_KEY` n'est pas configurée ;
- `500 Internal Server Error` : une erreur est survenue pendant le clustering ou l'appel au LLM.
