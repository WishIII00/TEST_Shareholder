import React, { useState, useEffect } from "react";
import "./App.css";
import ApiService from "./Component/api/NewAPIService";
import SearchComponent from "./Component/SearchComponent";
import ResultsTable from "./Component/ResultsTable";
import Swal from 'sweetalert2';

const App = () => {

  const [meetingInfo, setMeetingInfo] = useState({
    logoUrl: "",
    remarkTH: "",
    remarkEN: "",
  });

  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState({
    online: false,
    message: "ตรวจสอบ...",
  });

  useEffect(() => {
    loadInitialData();
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const result = await ApiService.fetchMeetingInfo();
      if (result.success) {
        setMeetingInfo(result.data);
      }
    } catch (error) {
      console.warn("โหลดข้อมูลล้มเหลว:", error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const checkApiConnection = async () => {
    const status = await ApiService.checkApiStatus();
    setApiStatus(status);
  };

  // ฟังก์ชันตรวจสอบเลขบัตรประชาชน 13 หลัก
  const validateCitizenId = (citizenId) => {
    // ตรวจสอบความยาว
    if (citizenId.length !== 13) {
      return false;
    }
    
    // ตรวจสอบว่าเป็นตัวเลขทั้งหมด
    if (!/^\d{13}$/.test(citizenId)) {
      return false;
    }
    
    // ตรวจสอบ checksum (algorithm ของเลขบัตรประชาชนไทย)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(citizenId.charAt(i)) * (13 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = (11 - remainder) % 10;
    
    return checkDigit === parseInt(citizenId.charAt(12));
  };

  const handleSearch = async (citizenId) => {
    // ตรวจสอบเลขบัตรประชาชนก่อน
    if (!validateCitizenId(citizenId)) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ถูกต้อง',
        text: 'กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setLoading(true);
    setSearchResults(null);
    setError("");

    try {
      await ApiService.logActivity("search_debenture", { citizenId });
      const result = await ApiService.searchByCitizenId(citizenId);

      if (result.success) {
        if (result.data && result.data.length > 0) {
          console.log(' ข้อมูลที่พบ:', result.data);

          const convertedData = result.data.map((item, index) => ({
            series: item.importFileName || "N/A",
            registrationNumber: item.accountId || item.original?.Account_ID || "N/A",
            holderName: item.fullName || `${item.firstName} ${item.lastName}`.trim() || "ไม่ระบุชื่อ",
            shareAmount: item.shareQuantity || item.original?.q_share || 0
          }));

          console.log(' ข้อมูลที่แปลงแล้ว:', convertedData);
          setSearchResults(convertedData);
          
          // แสดง popup สำเร็จ
          await Swal.fire({
            icon: 'success',
            title: 'พบข้อมูล',
            text: `พบข้อมูลผู้ถือหุ้นกู้ทั้งหมด ${convertedData.length} รายการ`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          setSearchResults([]);
          setError(result.message || "");
          
          // แสดง popup ไม่พบข้อมูล
          await Swal.fire({
            icon: 'warning',
            title: 'ไม่พบข้อมูล',
            text: 'ไม่พบข้อมูลผู้ถือหุ้นกู้จากเลขบัตรประชาชนที่กรอก',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#f39c12'
          });
        }
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการค้นหา");
        setSearchResults([]);
        
        // แสดง popup ข้อผิดพลาด
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: result.error || "เกิดข้อผิดพลาดในการค้นหา",
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#d33'
        });
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหา:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + err.message);
      setSearchResults([]);
      
      // แสดง popup ข้อผิดพลาดในการเชื่อมต่อ
      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดในการเชื่อมต่อ',
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDebentureClick = async (debentureCode) => {
    try {
      await ApiService.logActivity("select_debenture", { debenture: debentureCode });
      const url = ApiService.getDebentureUrl(debentureCode);
      window.open(url, "_blank");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเปิดลิงก์:", error);
      
      // แสดง popup ข้อผิดพลาดในการเปิดลิงก์
      await Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเปิดลิงก์ได้',
        text: 'เกิดข้อผิดพลาดในการเปิดลิงก์ กรุณาลองใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#d33'
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="container">
        <div className="loading-initial">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={`api-status ${apiStatus.online ? "online" : "offline"}`}>
        {apiStatus.message}
      </div>

      <div className="logo" style={{ textAlign: "center" }}>
        <img
          id="logoImage"
          src={
            meetingInfo.logoUrl ||
            "https://www.inventech.co.th/wp-content/uploads/2022/11/invlogo_bb.png"
          }
          alt="Logo"
        />
      </div>

      <div className="content-wrapper">
        <div className="content">
          <h2 id="type">ยื่นแบบคำร้องเข้าร่วมประชุม</h2>
          <h3 id="titleNameTH">การประชุมผู้ถือหุ้นกู้ ของบริษัท xxxxx</h3>
          <h3 id="titleNameEN">Debentureholders Meeting of xxxxxxx</h3>

          <SearchComponent onSearch={handleSearch} loading={loading} />

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>กำลังค้นหาข้อมูลในระบบ...</p>
            </div>
          )}

          {searchResults && !loading && (
            <ResultsTable results={searchResults} />
          )}

          <div className="instructions">
            <p>
              กรุณาเลือกหุ้นกู้รุ่นที่ท่านถืออยู่
              เพื่อยื่นแบบคำร้องขอรับชื่อผู้ใช้งาน และรหัสผ่าน
            </p>
            <p>
              Please select the series of debenture your currently hold. Request
              form to receive a username and password.
            </p>
          </div>
        </div>

        <div className="buttons">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ].map((num) => (
            <a
              key={num}
              onClick={() => handleDebentureClick(`rq${num}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="debenture-link"
            >
              หุ้นกู้  / Debenture XXXXX
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default App;