# Elfam Mixed Agribusiness Farm Management System
## System Architecture & Data Directory

Elfam is a generalized, multi-species Mixed Agribusiness Farm Management System engineered to support cattle, goats, sheep, pigs, poultry, and bees, alongside crop fields and soil health ledgers. The platform features strict Role-Based Access Control (RBAC) and real-time database safeguards like medication withholding flags.

---

## 1. System Topology & Data Flows

The following diagram illustrates the relationship between components, database tables, and the role-based routing layout.

```mermaid
graph TD
    %% Roles & Routing
    subgraph Users & Roles
        Supervisor["Supervisor (Executive)"]
        Manager["Manager (Operations)"]
        Worker["Worker (Logistics)"]
    end

    subgraph App Routes [Next.js App Router]
        SupervisorRoute["/supervisor<br/>(Gross Revenue, Staff Directory, Executive Summary, Reports)"]
        ManagerRoute["/manager<br/>(Livestock Registry, Fields Ledger, Inventory, Equipment, Requests)"]
        WorkerRoute["/worker<br/>(Production Yield Numpad, Crop Logs, Tasks, Requests)"]
    end

    Supervisor -->|Accesses| SupervisorRoute
    Manager -->|Accesses| ManagerRoute
    Worker -->|Accesses| WorkerRoute

    %% Database Entities
    subgraph Convex Database
        UsersTable["users"]
        LivestockTable["livestock<br/>(Cattle, Goats, Sheep, Pigs)"]
        GroupsTable["livestockGroups<br/>(Poultry, Bees)"]
        OffspringTable["offspring<br/>(Young cohort)"]
        ProductionTable["productionRecords<br/>(Yield logs: Milk, Eggs, Honey, Wool, Weight)"]
        TreatmentsTable["treatments<br/>(Withholding times)"]
        FieldsTable["fields<br/>(Crops: Wheat, Barley, Maize, Lucerne)"]
        SoilTable["soilTests<br/>(pH, N, P, K)"]
    end

    %% Relations
    UsersTable -->|Logs| ProductionTable
    UsersTable -->|Administers| TreatmentsTable
    UsersTable -->|Conducts| SoilTable

    LivestockTable -->|Yields| ProductionTable
    GroupsTable -->|Yields| ProductionTable
    OffspringTable -->|Promoted To| LivestockTable
    
    LivestockTable -->|Receives| TreatmentsTable
    GroupsTable -->|Receives| TreatmentsTable
    
    FieldsTable -->|Maintains| SoilTable
```

---

## 2. Entity-Relationship Diagram (ERD)

The following schema maps the database structures defined in [schema.ts](file:///c:/Users/roych/Downloads/Elfam/convex/schema.ts).

```mermaid
erDiagram
    users {
        string name
        string email
        string role "supervisor | manager | worker"
        string phone
        number joinedAt
        boolean profileSetupComplete
    }
    
    livestock {
        string tagNumber "Unique Key"
        string name
        string species "cattle | goat | sheep | pig | other"
        string breed
        number dateOfBirth
        string sex "M | F"
        string status "milking | dry | treatment | young | sold | deceased"
        number currentLactationNumber
        number lastBirthDate
        string sireInfo
        string damTagNumber
        string notes
    }

    livestockGroups {
        string groupCode "Unique Key"
        string name
        string species "poultry | bees | other"
        string breed
        string status "active | sold | deceased"
        number count
        number dateAcquiredOrHatched
        string notes
    }

    offspring {
        string tagNumber "Unique Key"
        string species
        string name
        number dateOfBirth
        string sex "M | F | unknown"
        string damTagNumber
        string sireInfo
        number weaningDate
        number currentWeight
        string status "young | promoted | sold | deceased"
    }

    productionRecords {
        id livestockId "Optional FK"
        id groupId "Optional FK"
        string type "milk | eggs | wool | honey | weight"
        number amount
        string session "AM | PM"
        string date "YYYY-MM-DD"
        id loggedBy "FK to users"
        number loggedAt
        boolean flagged "Medication active check"
    }

    treatments {
        id livestockId "Optional FK"
        id groupId "Optional FK"
        id incidentId "Optional FK"
        number date
        string condition
        string drugAdministered
        string dosage
        number withholdingDays
        number withholdingUntil
        id administeredBy "FK to users"
        string notes
    }

    fields {
        string name
        string crop "wheat | barley | maize | lucerne | fallow"
        number acres
        number plantedDate
        number expectedHarvestDate
        string notes
    }

    soilTests {
        id fieldId "FK to fields"
        number date
        number ph
        string nitrogen "low | medium | high"
        string phosphorus "low | medium | high"
        string potassium "low | medium | high"
        string recommendations
        id testedBy "FK to users"
    }

    productionRecords }|--|| livestock : "logs yield for"
    productionRecords }|--|| livestockGroups : "logs yield for"
    productionRecords }|--|| users : "recorded by"
    
    treatments }|--|| livestock : "applies to"
    treatments }|--|| livestockGroups : "applies to"
    treatments }|--|| users : "administered by"
    
    soilTests }|--|| fields : "measures health of"
    soilTests }|--|| users : "tested by"
```

---

## 3. Operational Safeguard: Withholding Logic

When production yields (e.g. Milk, Eggs, Honey) are logged, Elfam automatically cross-references the active treatments for that animal or group. If `Date.now() < withholdingUntil`, the production record is flagged as withheld to prevent contaminated products from entering the commercial bulk tank.

```
+-------------------------------------------------------+
|  Log Production Record Mutation                       |
+-------------------------------------------------------+
                           |
                           v
          Is there an active treatment where            
            withholdingUntil > current_time?            
             /                            \             
           YES                            NO            
           /                                \           
          v                                  v          
+--------------------+              +------------------+
| Flag record as     |              | Save record as   |
| WITHHELD (True)    |              | safe (Flagged=F) |
+--------------------+              +------------------+
          |                                  |
          v                                  v
Warning shown in UI:                Yield committed to  
"Output withheld!                   bulk ledger.        
Do not add to commercial stock."
```
