"""
Step 1 of the Contract Clause Extractor (part 2) - the 15 clause types
this project looks for in every contract.

Adjust this list per contract type: an NDA needs different clauses than
a vendor services agreement (an NDA rarely has "Payment Terms"; a vendor
agreement rarely has "Non-Compete"). This default list is a reasonable
starting point for a general commercial agreement, not a fixed standard.
"""

CLAUSE_TYPES = [
    "Payment Terms",
    "Termination",
    "Limitation of Liability",
    "Indemnification",
    "Intellectual Property Ownership",
    "Confidentiality",
    "Governing Law",
    "Dispute Resolution",
    "Auto-Renewal",
    "Assignment",
    "Warranties",
    "Force Majeure",
    "Non-Compete",
    "Data Protection",
    "Insurance Requirements",
]


if __name__ == "__main__":
    # Run this file on its own to check the taxonomy is well-formed:
    #     python taxonomy.py
    assert len(CLAUSE_TYPES) == 15
    assert len(CLAUSE_TYPES) == len(set(CLAUSE_TYPES))  # no accidental duplicates
    print(f"Taxonomy has {len(CLAUSE_TYPES)} clause types, all unique:")
    for clause_type in CLAUSE_TYPES:
        print(" -", clause_type)

    print("\nAll checks passed.")
