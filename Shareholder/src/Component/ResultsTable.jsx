import React from "react";

const ResultsTable = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div style={{ margin: "20px 0", fontSize: "30px", color: "#333" }}>
        ไม่พบข้อมูล
      </div>
    );
  }

  return (
    <div style={{ margin: "20px 0" }}>
      <table
        style={{
          width: "100%",
          margin: "0 auto",
          borderCollapse: "collapse",
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "20px", 
          overflow: "hidden", 
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#fffff" }}>
            <th style={{ padding: "10px", textAlign: "center" , border: "1px solid #ddd "}}>ห้องประชุม</th>
            <th style={{ padding: "10px", textAlign: "center", border: "1px solid #ddd " }}>เลขทะเบียน</th>
            <th style={{ padding: "10px", textAlign: "center" , border: "1px solid #ddd "}}>
              ชื่อผู้ถือหุ้น
            </th>
            <th style={{ padding: "10px", textAlign: "center",border: "1px solid #ddd "  }}>จำนวนหุ้น</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: "8px", textAlign: "center", border: "1px solid #ddd " }}>
                {item.series}
              </td>
              <td style={{ padding: "8px", textAlign: "center", border: "1px solid #ddd " }}>
                {item.registrationNumber}
              </td>
              <td style={{ padding: "8px", textAlign: "center" , border: "1px solid #ddd "}}>
                {item.holderName}
              </td>
              <td style={{ padding: "8px", textAlign: "center" , border: "1px solid #ddd "}}>
                {item.shareAmount?.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
