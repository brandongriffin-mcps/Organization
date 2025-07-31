# Organization Help

## Getting Started

Start by going through the [operating budget](https://www.montgomeryschoolsmd.org/departments/budget/) for the current fiscal year. Descend through the organizational charts under the Division of Special Education to see:

- Which offices are under each other
- What positions does each office have
- What is the full-time equivalent associated with each position
- Is a position funded by the IDEA grant

Now create an Excel workbook with a sheet named Hierarchy and a sheet named Positions. The Hierarchy sheet should have these columns:

| Name                                     | Parent                                   |
| ---------------------------------------- | ---------------------------------------- |
| Division of Specialized Support Services |                                          |
| Division of Special Education            | Division of Specialized Support Services |
| ...                                      | ...                                      |

**Make sure that there are no duplicate names or else a bunch of positions will end up under the wrong office!**

The names of all the offices should be under the Name column, and the office directly above each office should be in the Parent column. The first row having a blank parent indicates that its the top level office.

The Positions sheet should have these columns:

| Title                         | Full-Time Equivalent | Office                                   | IDEA Grant Funded |
| ----------------------------- | -------------------- | -----------------------------------------| ----------------- |
| Chief Student Support Officer | 1.0000               | Division of Specialized Support Services | FALSE             |
| ...                           | ...                  | ...                                      | ...               |

The positions under every office should be in this sheet.

Once all the data has been entered properly, save the workbook. Click File > Open (or press `Ctrl` + `O`) in the application and open the workbook you just created.

## Chart Navigation

Navigating the chart should be intuitive and straightforward:
- Drag the mouse on the background to move around
- Use the mouse wheel to zoom in and out
    - You can also use the zoom bar in the bottom left