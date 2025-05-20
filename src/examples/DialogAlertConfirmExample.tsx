import { useDialog } from "@/providers/DialogProvider";
import { Button } from "@/components/ui/button";

/**
 * 다이얼로그 사용 예제 컴포넌트
 * 
 * showDialog, showAlert, showConfirm 사용법 데모
 */
export const DialogAlertConfirmExample = () => {
  const { showDialog, showAlert, showConfirm } = useDialog();

  // showDialog 예제 (일반)
  const handleShowDefaultDialog = () => {
    showDialog({
      title: "알림",
      message: "기본 다이얼로그 메시지입니다.",
      onConfirm: () => console.log("확인 버튼이 클릭되었습니다."),
      onCancel: () => console.log("취소 버튼이 클릭되었습니다.")
    });
  };

  // showDialog 예제 (경고)
  const handleShowWarningDialog = () => {
    showDialog({
      title: "경고",
      message: "경고 다이얼로그 메시지입니다.",
      confirmText: "계속하기",
      cancelText: "취소",
      variant: "warning",
      onConfirm: () => console.log("경고 다이얼로그 확인 버튼이 클릭되었습니다.")
    });
  };

  // showDialog 예제 (삭제)
  const handleShowDestructiveDialog = () => {
    showDialog({
      title: "삭제 확인",
      message: "이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
      variant: "destructive",
      onConfirm: () => console.log("항목이 삭제되었습니다."),
      onCancel: () => console.log("삭제가 취소되었습니다.")
    });
  };

  // showAlert 예제
  const handleShowAlert = () => {
    showAlert(
      "안내", 
      "이것은 단순 알림 메시지입니다. 확인 버튼만 있습니다.",
      () => console.log("알림 확인 버튼이 클릭되었습니다.")
    );
  };

  // showConfirm 예제 (기본)
  const handleShowBasicConfirm = () => {
    showConfirm(
      "작업 확인", 
      "이 작업을 진행하시겠습니까?",
      (confirmed) => console.log("사용자 선택:", confirmed ? "확인" : "취소")
    );
  };

  // showConfirm 예제 (커스텀)
  const handleShowCustomConfirm = () => {
    showConfirm(
      "삭제 확인", 
      "이 데이터를 영구적으로 삭제하시겠습니까?",
      (confirmed) => {
        if (confirmed) {
          console.log("데이터가 삭제되었습니다.");
        } else {
          console.log("삭제가 취소되었습니다.");
        }
      },
      {
        confirmText: "삭제하기",
        cancelText: "취소하기",
        confirmButtonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      }
    );
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-4">다이얼로그 시스템 예제</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">showDialog 함수</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button onClick={handleShowDefaultDialog}>
            기본 다이얼로그
          </Button>
          <Button 
            onClick={handleShowWarningDialog}
            className="bg-orange-500 hover:bg-orange-600"
          >
            경고 다이얼로그
          </Button>
          <Button 
            onClick={handleShowDestructiveDialog}
            variant="destructive"
          >
            삭제 다이얼로그
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">showAlert 함수</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button onClick={handleShowAlert}>
            알림 다이얼로그
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">showConfirm 함수</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button onClick={handleShowBasicConfirm}>
            기본 확인 다이얼로그
          </Button>
          <Button 
            onClick={handleShowCustomConfirm}
            variant="destructive"
          >
            커스텀 확인 다이얼로그
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DialogAlertConfirmExample;