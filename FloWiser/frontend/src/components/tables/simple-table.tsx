type SimpleTableProps = {
  headers: string[];
  rows: string[][];
};

export const SimpleTable = ({ headers, rows }: SimpleTableProps) => {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "var(--surface)",
        borderRadius: 16,
        overflow: "hidden"
      }}
    >
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              style={{
                textAlign: "left",
                padding: 16,
                borderBottom: "1px solid var(--border)",
                color: "var(--muted)",
                fontSize: 14
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td
                key={`${rowIndex}-${cellIndex}`}
                style={{ padding: 16, borderBottom: "1px solid var(--border)" }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
