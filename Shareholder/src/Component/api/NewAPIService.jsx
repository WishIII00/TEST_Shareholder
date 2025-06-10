const API_URL = 'http://localhost:5278';

class ApiService {
  
  static async searchByCitizenId(citizenId) {
    try {
      if (!citizenId || citizenId.length !== 13) {
        return {
          success: false,
          error: 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก'
        };
      }

      console.log('ค้นหาข้อมูล:', citizenId);

      const response = await fetch(`${API_URL}/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [],
            message: ''
          };
        }
        throw new Error(`เกิดข้อผิดพลาด: ${response.status} - ${response.statusText}`);
      }

      const apiResponse = await response.json();
      console.log('Response จาก API:', apiResponse);

      const data = apiResponse.success ? apiResponse.data : apiResponse;
      const allResults = this.convertData(data);
      
      console.log('=== เริ่มการกรองข้อมูล ===');
      console.log('ค้นหาเลข:', citizenId, 'ประเภท:', typeof citizenId);
      console.log('จำนวนข้อมูลทั้งหมด:', allResults.length);
      
      const filteredResults = allResults.filter((item, index) => {
        // Debug แสดงข้อมูล 3 รายการแรก
        if (index < 3) {
          console.log(`รายการ ${index + 1}:`, {
            accountId: item.accountId,
            referenceId: item.referenceId,
            referenceId_type: typeof item.referenceId,
            original_i_ref: item.original.i_ref,
            original_Account_ID: item.original.Account_ID,
            firstName: item.firstName,
            lastName: item.lastName
          });
        }
        
        // แปลงเป็น string ทั้งคู่เพื่อเปรียบเทียบ
        const citizenIdStr = String(citizenId);
        const referenceIdStr = String(item.referenceId || '');
        const accountIdStr = String(item.accountId || '');
        const originalRefStr = String(item.original.i_ref || '');
        const originalAccStr = String(item.original.Account_ID || '');
        
        const match = (
          referenceIdStr === citizenIdStr || 
          accountIdStr.includes(citizenIdStr) ||
          originalRefStr === citizenIdStr ||
          originalAccStr === citizenIdStr ||
          accountIdStr === citizenIdStr
        );
        
        if (match) {
          console.log('พบข้อมูลที่ตรงกัน!', {
            citizenId: citizenIdStr,
            matchedField: referenceIdStr === citizenIdStr ? 'referenceId' : 
                         accountIdStr === citizenIdStr ? 'accountId' :
                         originalRefStr === citizenIdStr ? 'original.i_ref' :
                         originalAccStr === citizenIdStr ? 'original.Account_ID' : 'other',
            item: item
          });
        }
        
        return match;
      });

      console.log('จำนวนข้อมูลที่กรองได้:', filteredResults.length);

      return {
        success: true,
        data: filteredResults,
        totalFound: filteredResults.length,
        message: filteredResults.length > 0 ? `พบข้อมูล ${filteredResults.length} รายการ` : ''
      };

    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      return {
        success: false,
        error: error.message || 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่'
      };
    }
  }

  static async getAllShareholders(limit = 100) {
    try {
      console.log('ดึงรายการผู้ถือหุ้น...');

      const response = await fetch(`${API_URL}/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`เกิดข้อผิดพลาด: ${response.status} - ${response.statusText}`);
      }

      const apiResponse = await response.json();
      console.log('Response จาก API:', apiResponse);

      const data = apiResponse.success ? apiResponse.data : apiResponse;
      const results = this.convertData(data);

      const limitedResults = limit ? results.slice(0, limit) : results;

      return {
        success: true,
        data: limitedResults,
        totalFound: limitedResults.length,
        totalInDatabase: results.length,
        message: `ดึงข้อมูลสำเร็จ ${limitedResults.length} รายการ`
      };

    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      return {
        success: false,
        error: error.message || 'ไม่สามารถดึงข้อมูลได้'
      };
    }
  }

  static convertData(apiData) {
    if (!apiData) return [];
    
    const dataArray = Array.isArray(apiData) ? apiData : [apiData];

    return dataArray.map((item, index) => ({
      accountId: item.accountId || item.Account_ID || `ACC${String(index + 1).padStart(6, '0')}`,
      shareQuantity: item.shareQuantity || item.q_share || 0,
      fullName: this.getFullName(item),
      firstName: item.firstName || item.n_first || '',
      lastName: item.lastName || item.n_last || '',
      referenceId: item.referenceId || item.i_ref || '',
      importFileName: item.importFileName || item.ImportFileName || '',
      formattedShareQuantity: this.formatNumber(item.shareQuantity || item.q_share || 0),
      original: item
    }));
  }

  static getFullName(item) {
    if (item.fullName) return item.fullName;
    
    const firstName = item.firstName || item.n_first || '';
    const lastName = item.lastName || item.n_last || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    return 'ผู้ถือหุ้น';
  }

  static formatNumber(number) {
    if (!number || isNaN(number)) return '0';
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number);
  }

  static async testConnection() {
    try {
      console.log('ทดสอบการเชื่อมต่อ...');
      
      const response = await fetch(`${API_URL}/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('เชื่อมต่อสำเร็จ! ตัวอย่างข้อมูล:', data);
        return {
          success: true,
          message: 'เชื่อมต่อ API สำเร็จ',
          sampleData: data
        };
      } else {
        console.log('เชื่อมต่อไม่ได้:', response.status);
        return {
          success: false,
          error: `ไม่สามารถเชื่อมต่อได้ (${response.status})`
        };
      }
    } catch (error) {
      console.error('ทดสอบล้มเหลว:', error);
      return {
        success: false,
        error: error.message || 'ไม่สามารถเชื่อมต่อได้'
      };
    }
  }

  static async fetchMeetingInfo() {
    return {
      success: true,
      data: {
        logoUrl: "https://www.inventech.co.th/wp-content/uploads/2022/11/invlogo_bb.png",
        remarkTH: "กรุณาติดต่อฝ่ายนักลงทุนสัมพันธ์ หากมีข้อสงสัย",
        remarkEN: "Please contact Investor Relations if you have any questions"
      }
    };
  }

  static async checkApiStatus() {
    const connectionTest = await this.testConnection();
    return {
      online: connectionTest.success,
      message: connectionTest.success ? "" : "ไม่สามารถเชื่อมต่อได้"
    };
  }

  static async searchDebenture(citizenId) {
    return await this.searchByCitizenId(citizenId);
  }

  static async logActivity(action, data) {
    console.log(` Log Activity: ${action}`, data);
    return { success: true };
  }

  static getDebentureUrl(debentureCode) {
    const urls = {
      rq1: "http://localhost:5278/home",
      rq2: "https://example.com/form/rq2",
      rq3: "https://example.com/form/rq3",
      rq4: "https://example.com/form/rq4",  
      rq5: "https://example.com/form/rq5",
      rq6: "https://example.com/form/rq6",
      rq7: "https://example.com/form/rq7",
      rq8: "https://example.com/form/rq8",
      rq9: "https://example.com/form/rq9",
      rq10: "https://example.com/form/rq10",
    };
    return urls[debentureCode] || "https://example.com/form/default";
  }
}

export default ApiService;