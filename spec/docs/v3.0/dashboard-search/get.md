
## Search on dashboard resouces


This endpoint will perform a search on the resources (boards, folders, forms) on which user has access.
This response contains three separate lists, and each list can contain maximum of 5 items.
This list is searchable and does not accept pagination.

Response example:

```
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "boards": [
            {
                "slug": "R9J4MlCH",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "pinned": false,
                "folder": {
                    "subfolders_count": 4,
                    "slug": "yiHJh2r3",
                    "title": "Base",
                    "color": null,
                    "soft_deleted": false
                },
                "share_address": "2r4w7h9ti540ano",
                "is_public": false,
                "thumbnail_url": null,
                "banner_url": null,
                "logo_url": null,
                "version": "v2",
                "created_at": "2024-07-18T17:10:09.486302+03:30",
                "updated_at": "2024-08-02T16:00:59.795628+03:30"
            },
            {
                "slug": "NiTHiYNp",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "pinned": false,
                "folder": null,
                "share_address": "vafotwa4ia91n09",
                "is_public": false,
                "thumbnail_url": null,
                "banner_url": null,
                "logo_url": null,
                "version": "v2",
                "created_at": "2024-07-18T17:08:56.407426+03:30",
                "updated_at": "2024-07-18T17:08:56.459007+03:30"
            },
            {
                "slug": "GRvA9G88",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "pinned": false,
                "folder": null,
                "share_address": "kntsfczjq4znggv",
                "is_public": false,
                "thumbnail_url": null,
                "banner_url": null,
                "logo_url": null,
                "version": "v2",
                "created_at": "2024-07-18T17:07:50.152238+03:30",
                "updated_at": "2024-07-18T17:07:50.228952+03:30"
            },
            {
                "slug": "WrXV6DRa",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "pinned": false,
                "folder": null,
                "share_address": "uf8yf3toqp0s5ac",
                "is_public": false,
                "thumbnail_url": null,
                "banner_url": null,
                "logo_url": null,
                "version": "v2",
                "created_at": "2024-07-18T17:05:01.931192+03:30",
                "updated_at": "2024-07-18T17:05:01.973550+03:30"
            },
            {
                "slug": "mGYTh8wQ",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "pinned": false,
                "folder": null,
                "share_address": "aci75l7hgn6f61b",
                "is_public": false,
                "thumbnail_url": null,
                "banner_url": null,
                "logo_url": null,
                "version": "v2",
                "created_at": "2024-07-18T17:01:14.691145+03:30",
                "updated_at": "2024-07-18T17:01:14.729864+03:30"
            }
        ],
        "folders": [
            {
                "slug": "yiHJh2r3",
                "title": "Base",
                "color": null,
                "created_at": "2024-05-14T11:37:35.649725+03:30",
                "updated_at": "2024-05-14T11:37:35.649746+03:30"
            },
            {
                "slug": "ChCVu4Kg",
                "title": "Grand Parent Folder",
                "color": null,
                "created_at": "2024-05-02T11:38:53.507929+03:30",
                "updated_at": "2024-05-02T11:38:53.507992+03:30"
            }
        ],
        "forms": [
            {
                "slug": "HwSFJRPq",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "full_form_address": "https://formaloo.xi/mto4iw",
                "category": {
                    "title": "Base",
                    "color": null,
                    "slug": "yiHJh2r3",
                    "parent_category": {
                        "title": "",
                        "color": "",
                        "slug": ""
                    }
                },
                "total_submits_count": 31,
                "submit_count": 31,
                "logo_url": null,
                "created_at": "2024-07-18T17:10:09.328024+03:30",
                "updated_at": "2024-08-02T16:02:38.471639+03:30"
            },
            {
                "slug": "rAUKtKI5",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "full_form_address": "https://formaloo.xi/nhxbe6",
                "category": null,
                "total_submits_count": 0,
                "submit_count": 0,
                "logo_url": null,
                "created_at": "2024-07-18T17:08:56.299835+03:30",
                "updated_at": "2024-07-18T17:11:57.015906+03:30"
            },
            {
                "slug": "JVk8XZ8m",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "full_form_address": "https://formaloo.xi/b4tfl2",
                "category": null,
                "total_submits_count": 0,
                "submit_count": 0,
                "logo_url": null,
                "created_at": "2024-07-18T17:07:49.964116+03:30",
                "updated_at": "2024-07-18T17:07:50.239225+03:30"
            },
            {
                "slug": "wihJb1P4",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "full_form_address": "https://formaloo.xi/csrgqd",
                "category": null,
                "total_submits_count": 0,
                "submit_count": 0,
                "logo_url": null,
                "created_at": "2024-07-18T17:05:01.819360+03:30",
                "updated_at": "2024-07-18T17:05:01.978321+03:30"
            },
            {
                "slug": "lRMArgHL",
                "title": "G-sheet import - 1YGZivaftfGrwxqLkBBGz3X12PSg1FpcdFIBx1n79uS8",
                "full_form_address": "https://formaloo.xi/i2v1r0",
                "category": null,
                "total_submits_count": 0,
                "submit_count": 0,
                "logo_url": null,
                "created_at": "2024-07-18T17:01:14.588963+03:30",
                "updated_at": "2024-07-18T17:01:14.734161+03:30"
            }
        ]
    }
}
```