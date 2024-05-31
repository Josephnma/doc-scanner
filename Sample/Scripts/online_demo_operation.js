
//--------------------------------------------------------------------
//************************** Import Image*****************************
//--------------------------------------------------------------------
/*-----------------select source---------------------*/
function source_onchange() {

  if (document.getElementById("divTwainType"))
    document.getElementById("divTwainType").style.display = "";

  if (document.getElementById("source")) {
    var cIndex = document.getElementById("source").selectedIndex;
    if (!Dynamsoft.Lib.env.bWin) {
      if (document.getElementById("lblShowUI"))
        document.getElementById("lblShowUI").style.display = "none";
      if (document.getElementById("ShowUI"))
        document.getElementById("ShowUI").style.display = "none";
    }
    else {
      DWObject.SelectDeviceAsync(deviceList[cIndex]);

      var showUI = document.getElementById("ShowUI");
      if (showUI) {
        if (deviceList[cIndex] && deviceList[cIndex].displayName && deviceList[cIndex].displayName.indexOf("WIA-") == 0) {
          showUI.disabled = true;
          showUI.checked = false;
        } else
          showUI.disabled = false;
      }
    }
  }
}


function mediaType_onchange() {
  var MediaType = document.getElementById("MediaType");
  if (MediaType && MediaType.options.length > 0) {
    valueMediaType = MediaType.options[MediaType.selectedIndex].text;
    if (valueMediaType != "")
      if (!DWObject.Addon.Webcam.SetMediaType(valueMediaType)) {
        appendMessage('<b>Error setting MediaType value: </b>');
        appendMessage("<span style='color:#cE5E04'><b>" + DWObject.ErrorString + "</b></span><br />");
        return;
      }
  }

  var ResolutionWebcam = document.getElementById("ResolutionWebcam");
  if (ResolutionWebcam) {
    ResolutionWebcam.options.length = 0;
    var aryResolution = DWObject.Addon.Webcam.GetResolution();
    countResolution = aryResolution.GetCount();
    for (i = 0; i < countResolution; i++) {
      value = aryResolution.Get(i);
      ResolutionWebcam.options.add(new Option(value, value));
    }
  }
}

/*-----------------Acquire Image---------------------*/

function acquireImage() {
  var cIndex = document.getElementById('source').selectedIndex;
  if (cIndex < 0)
    return;

  var i, iPixelType = 0;
  for (i = 0; i < 3; i++) {
    if (document.getElementsByName('PixelType').item(i).checked == true)
      iPixelType = i;
  }

  DWObject.SelectDeviceAsync(deviceList[cIndex]).then(function () {
    return DWObject.AcquireImageAsync({
      IfShowUI: document.getElementById('ShowUI').checked,
      PixelType: iPixelType,
      Resolution: document.getElementById('Resolution').value,
      IfFeederEnabled: document.getElementById('ADF').checked,
      IfDuplexEnabled: document.getElementById('Duplex').checked,
      IfAutoDiscardBlankpages: document.getElementById('DiscardBlankPage').checked,
      IfDisableSourceAfterAcquire: true // Scanner source will be disabled/closed automatically after the scan.
    });
  }).then(function () {
    appendMessage('<b>Scan: </b>');
    checkErrorStringWithErrorCode(0, 'Successful.');
    return DWObject.CloseSourceAsync();
  }).catch(function (exp) {
    appendMessage('<b>Scan: </b>');
    checkErrorStringWithErrorCode(-1, exp.message);
  });
}

/*-----------------Download Image---------------------*/
function downloadSamplePDF() {
  appendMessage('<b>Downloaded image: </b>');

  var OnSuccess = function () {
    checkErrorString();

    var divLoadAndDownload = document.getElementById("divLoadAndDownload");
    if (divLoadAndDownload)
      divLoadAndDownload.parentNode.removeChild(divLoadAndDownload);
  };

  var OnFailure = function (errorCode, errorString) {
    checkErrorStringWithErrorCode(errorCode, errorString);
  };

  DWObject.IfSSL = Dynamsoft.Lib.detect.ssl;
  var _strPort = location.port == "" ? 80 : location.port;
  if (Dynamsoft.Lib.detect.ssl == true)
    _strPort = location.port == "" ? 443 : location.port;
  DWObject.HTTPPort = _strPort;
  var CurrentPathName = unescape(location.pathname); // get current PathName in plain ASCII	
  var CurrentPath = CurrentPathName.substring(0, CurrentPathName.lastIndexOf("/") + 1);
  var strDownloadFile = CurrentPath + "Images/DynamsoftSample.pdf";

  DWObject.HTTPDownload(location.hostname, strDownloadFile, OnSuccess, OnFailure);
}


/*-----------------Load Image---------------------*/
function btnLoadImagesOrPDFs_onclick() {
  appendMessage('<b>Loaded image: </b>');

  var OnPDFSuccess = function () {

    checkErrorString();

    var divLoadAndDownload = document.getElementById('divLoadAndDownload');
    if (divLoadAndDownload)
      divLoadAndDownload.parentNode.removeChild(divLoadAndDownload);
  };

  var OnPDFFailure = function (errorCode, errorString) {
    checkErrorStringWithErrorCode(errorCode, errorString);
  };
  DWObject.IfShowFileDialog = true;
  DWObject.Addon.PDF.SetReaderOptions({
    convertMode: Dynamsoft.DWT.EnumDWT_ConvertMode.CM_AUTO,
    renderOptions: {
      resolution: 200
    }
  });
  DWObject.LoadImageEx('', Dynamsoft.DWT.EnumDWT_ImageType.IT_ALL, OnPDFSuccess, OnPDFFailure);
}

//--------------------------------------------------------------------------------------
//************************** Edit Image ******************************

//--------------------------------------------------------------------------------------
function btnShowImageEditor_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  var imageEditor = DWObject.Viewer.createImageEditor();
  imageEditor.show();
}

/*----------------------RotateLeft Method---------------------*/
function btnRotateLeft_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  DWObject.RotateLeft(DWObject.CurrentImageIndexInBuffer);
  appendMessage('<b>Rotate left: </b>');
  if (checkErrorString()) {
    return;
  }
}

/*----------------------Crop Method---------------------*/
function btnCrop_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  if (_iLeft != 0 || _iTop != 0 || _iRight != 0 || _iBottom != 0) {
    DWObject.Crop(
      DWObject.CurrentImageIndexInBuffer,
      _iLeft, _iTop, _iRight, _iBottom
    );
    _iLeft = 0;
    _iTop = 0;
    _iRight = 0;
    _iBottom = 0;

    if (DWObject.isUsingActiveX())
      DWObject.SetSelectedImageArea(DWObject.CurrentImageIndexInBuffer, 0, 0, 0, 0);

    appendMessage('<b>Crop: </b>');
    if (checkErrorString()) {
      return;
    }
    return;
  } else {
    appendMessage("<b>Crop: </b>failed. Please first select the area you'd like to crop.<br />");
  }
}

/*----------------------Select Method---------------------*/
function btnSelect_onclick() {
  handAndSelectSelected(false);

  DWObject.Viewer.cursor = "crosshair";
}

function handAndSelectSelected(bHandSelected) {
  var btnHand = document.getElementById("btnHand");
  var btnHand_selected = document.getElementById("btnHand_selected");
  var btnSelect = document.getElementById("btnSelect");
  var btnSelect_selected = document.getElementById("btnSelect_selected");
  if (bHandSelected) {
    if (btnHand)
      btnHand.style.display = "none";
    if (btnHand_selected)
      btnHand_selected.style.display = "";
    if (btnSelect)
      btnSelect.style.display = "";
    if (btnSelect_selected)
      btnSelect_selected.style.display = "none";
  } else {
    if (btnHand)
      btnHand.style.display = "";
    if (btnHand_selected)
      btnHand_selected.style.display = "none";
    if (btnSelect)
      btnSelect.style.display = "none";
    if (btnSelect_selected)
      btnSelect_selected.style.display = "";
  }
}

/*----------------------Hand Method---------------------*/
function btnHand_onclick() {
  handAndSelectSelected(true);
  DWObject.Viewer.cursor = "pointer";
}

/*----------------------orig_size Method---------------------*/
function btnOrigSize_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  var btnOrigSize = document.getElementById("btnOrigSize");
  if (btnOrigSize)
    btnOrigSize.style.display = "none";
  var btnFitWindow = document.getElementById("btnFitWindow");
  if (btnFitWindow)
    btnFitWindow.style.display = "";

  DWObject.Viewer.zoom = 1;
  updateZoomInfo();
  enableButtonForZoomInAndOut();
}

/*----------------------FitWindow Method---------------------*/
function btnFitWindow_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  var btnOrigSize = document.getElementById("btnOrigSize");
  if (btnOrigSize)
    btnOrigSize.style.display = "";
  var btnFitWindow = document.getElementById("btnFitWindow");
  if (btnFitWindow)
    btnFitWindow.style.display = "none";

  DWObject.Viewer.fitWindow();
  updateZoomInfo();
  enableButtonForZoomInAndOut();
}


/*----------------------ZoomIn Method---------------------*/
function enableButtonForZoomInAndOut() {
  var btnZoomIn = $("#btnZoomIn");
  var zoom = Math.round(DWObject.Viewer.zoom * 100);

  if (zoom >= 6500) {
    if (btnZoomIn)
      btnZoomIn.addClass('grayimg');
    return;
  } else {
    if (btnZoomIn)
      btnZoomIn.removeClass('grayimg');

    var btnZoomOut = $("#btnZoomOut");
    if (zoom <= 2) {
      if (btnZoomOut)
        btnZoomOut.addClass('grayimg');
      return;
    } else {
      if (btnZoomOut)
        btnZoomOut.removeClass('grayimg');
    }
  }
}

function btnZoomIn_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  var zoom = Math.round(DWObject.Viewer.zoom * 100);
  if (zoom >= 6500)
    return;

  var zoomInStep = 5;
  DWObject.Viewer.zoom = (DWObject.Viewer.zoom * 100 + zoomInStep) / 100.0;
  updateZoomInfo();
  enableButtonForZoomInAndOut();
}

/*----------------------ZoomOut Method---------------------*/
function btnZoomOut_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  var zoom = Math.round(DWObject.Viewer.zoom * 100);
  if (zoom <= 2)
    return;

  var zoomOutStep = 5;
  DWObject.Viewer.zoom = (DWObject.Viewer.zoom * 100 - zoomOutStep) / 100.0;
  updateZoomInfo();
  enableButtonForZoomInAndOut();
}

//------------------------------------------------------------------------
//************************** Save Image***********************************
//------------------------------------------------------------------------
function saveUploadImage(type) {
  if (type == 'local') {
    btnSave_onclick();
  } else if (type == 'server') {
    btnUpload_onclick()
  }
}

function btnSave_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  appendMessage('<b>Save Image: </b>');

  var fileType = document.getElementById("fileType");
  var strPageType_save = fileType.value;

  DWObject.IfShowFileDialog = true;
  var _txtFileNameforSave = document.getElementById("txt_fileName");
  if (_txtFileNameforSave)
    _txtFileNameforSave.className = "";
  var bSave = false;

  var strFilePath = _txtFileNameforSave.value + "." + strPageType_save;

  var OnSuccess = function () {
    checkErrorStringWithErrorCode(0, "Successful.");
  };

  var OnFailure = function (errorCode, errorString) {
    checkErrorStringWithErrorCode(errorCode, errorString);
  };

  var allPages = document.getElementById("AllPages");
  var vAsyn = false;
  if (allPages.checked == true) {
    if (strPageType_save == "tif") {  //tiff
      vAsyn = true;
      bSave = DWObject.SaveAllAsMultiPageTIFF(strFilePath, OnSuccess, OnFailure);
    }
    else if (strPageType_save == "pdf") { //pdf
      vAsyn = true;
      bSave = DWObject.SaveAllAsPDF(strFilePath, OnSuccess, OnFailure);
    }
  } else {
    switch (strPageType_save) {
      case "bmp": bSave = DWObject.SaveAsBMP(strFilePath, DWObject.CurrentImageIndexInBuffer); break;
      case "jpg": bSave = DWObject.SaveAsJPEG(strFilePath, DWObject.CurrentImageIndexInBuffer); break;
      case "tif": bSave = DWObject.SaveAsTIFF(strFilePath, DWObject.CurrentImageIndexInBuffer); break;
      case "png": bSave = DWObject.SaveAsPNG(strFilePath, DWObject.CurrentImageIndexInBuffer); break;
      case "pdf": bSave = DWObject.SaveAsPDF(strFilePath, DWObject.CurrentImageIndexInBuffer); break;
    }
  }

  if (vAsyn == false) {
    //if (bSave)
    //appendMessage('<b>Save Image: </b>');
    if (checkErrorString()) {
      return;
    }
  }
}

function fileType_onchange() {
  var currentPage = document.getElementById("CurrentPage");
  var allPages = document.getElementById("AllPages");
  var fileType = document.getElementById("fileType");
  var strPageType = fileType.value;
  if (strPageType == "pdf" || strPageType == "tif") {
    if (currentPage)
      currentPage.disabled = false;
    if (allPages)
      allPages.disabled = false;
    if (strPageType == "pdf") {
      if (allPages)
        allPages.checked = true;
    }
    if (strPageType == "tif") {
      if (currentPage)
        currentPage.checked = true;
    }

  } else {
    if (currentPage) {
      currentPage.disabled = true;
      currentPage.checked = true;
    }
    if (allPages)
      allPages.disabled = true;
  }
}
//--------------------------------------------------------------------------
//************************** Upload Image***********************************
//--------------------------------------------------------------------------
function btnUpload_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  appendMessage('<b>Upload: </b>');
  if(location.protocol == "file:") {
    checkErrorStringWithErrorCode(-1, "Failed. The sample code should be deployed to the web server.");
    return;
  }

  var strHTTPServer, strActionPage, strImageType;

  var _txtFileName = document.getElementById("txt_fileName");
  if (_txtFileName)
    _txtFileName.className = "";

  //DWObject.MaxInternetTransferThreads = 5;
  strHTTPServer = location.hostname;

  DWObject.IfSSL = Dynamsoft.Lib.detect.ssl;
  var _strPort = location.port == "" ? 80 : location.port;
  if (Dynamsoft.Lib.detect.ssl == true)
    _strPort = location.port == "" ? 443 : location.port;
  DWObject.HTTPPort = _strPort;

  var CurrentPathName = unescape(location.pathname); // get current PathName in plain ASCII	
  var CurrentPath = CurrentPathName.substring(0, CurrentPathName.lastIndexOf("/") + 1);
  strActionPage = CurrentPath + strUploadFileActionPage;
  var fileType = document.getElementById("fileType");
  var strPageType = fileType.value;
  switch (strPageType) {
    case "bmp": strImageType = 0; break;
    case "jpg": strImageType = 1; break;
    case "tif": strImageType = 2; break;
    case "png": strImageType = 3; break;
    case "pdf": strImageType = 4; break;
  }

  var fileName = _txtFileName.value;
  var replaceStr = "<";
  fileName = fileName.replace(new RegExp(replaceStr, 'gm'), '&lt;');
  var uploadfilename = fileName + "." + strPageType;

  var OnSuccess = function (httpResponse) {
    checkErrorStringWithErrorCode(0, "Successful.");
  };

  var OnFailure = function (errorCode, errorString, httpResponse) {
    if (errorCode != 0 && errorCode != -2003)
      checkErrorStringWithErrorCode(errorCode, errorString, httpResponse);
    else {
      var textFromServer = httpResponse;
      __printUploadedFiles(textFromServer);
      checkErrorStringWithErrorCode(0, "Successful.");
    }

  };

  var customInfo = document.getElementById("txt_CustomInfo");
  DWObject.SetHTTPFormField("CustomInfo", customInfo.value);

  var allPages = document.getElementById("AllPages");
  if (allPages.checked == true) {
    if (strPageType == "tif") {
      DWObject.HTTPUploadAllThroughPostAsMultiPageTIFF(
        strHTTPServer,
        strActionPage,
        uploadfilename,
        OnSuccess, OnFailure
      );
    }
    else if (strPageType == "pdf") {
      DWObject.HTTPUploadAllThroughPostAsPDF(
        strHTTPServer,
        strActionPage,
        uploadfilename,
        OnSuccess, OnFailure
      );
    }
  } else {
    DWObject.HTTPUploadThroughPostEx(
      strHTTPServer,
      DWObject.CurrentImageIndexInBuffer,
      strActionPage,
      uploadfilename,
      strImageType,
      OnSuccess, OnFailure
    );
  }
}

function __printUploadedFiles(strResponse) {

  var arrResponse, i, customInfo, fileName, folder;
  if(strResponse) {
    // "info:xxx|filename:xxx|folder:xxx"
    arrResponse = strResponse.split('|');
    if (arrResponse.length>=3) {
      var tmp;
      for(i=0; i<arrResponse.length; i++){
        tmp = arrResponse[i];
        if(tmp.indexOf('info:') == 0) {
          if(tmp.length > 5) {
            customInfo = tmp.substring(5);
          } else {
            customInfo = "";
          }
        } else if(tmp.indexOf('filename:') == 0) {
          if(tmp.length > 9) {
            fileName = tmp.substring(9);
          }
        } else if(tmp.indexOf('folder:') == 0) {
          if(tmp.length > 7) {
            folder = tmp.substring(7);
          }
        }
      }
    }
  }

  if (customInfo != undefined && fileName != undefined && folder != undefined) {

    var strDisplayName, strCustomInfo;
    if (fileName.length > 25) {
      strDisplayName = fileName.substring(0, 10) + "..." + fileName.substring(fileName.length - 14, fileName.length);
    } else
      strDisplayName = fileName;

    if (customInfo.length > 25) {
      strCustomInfo = customInfo.substring(0, 10) + "..." + customInfo.substring(customInfo.length - 14, customInfo.length);
    } else
      strCustomInfo = customInfo;

    try {
      var realfileName = [folder, '/', fileName].join('');
      var newDiv = document.createElement('div');
      newDiv.className = 'ds-uploaded-block';
      newDiv.innerHTML = "<span class='ds-uploaded-block-title'>File Name:</span><span class='ds-uploaded-block-content'>" + strDisplayName + "</span><br/>" +
        "<span class='ds-uploaded-block-title'>Custom Info:</span><span class='ds-uploaded-block-content'>" + strCustomInfo + "</span><br/>" +
        "<a class='ds-uploaded-remove' data='" + realfileName + "' href='#'>Del</a><span> | </span><a target='_blank' href = '" + strDownloadPage + realfileName + "'>Download</a>";

      var resultWrap = document.getElementById("resultWrap");
      resultWrap.appendChild(newDiv);
      resultWrap.scrollTop = resultWrap.scrollHeight;

      let btnDelete = newDiv.querySelector(".ds-uploaded-remove");
      if(btnDelete) {
        btnDelete.addEventListener('click', (evt) => {
          let _this = evt.target;
          let _realfileName = _this.getAttribute('data');
  
          if(_realfileName) {
            $.ajax(strDeleteFileActionPage + _realfileName, {
              method: 'GET',
              success: function () { }
            });
          }
  
          let parent = _this.parentNode;
          if(parent) {
            parent.parentNode.removeChild(parent);
          }
  
        });
      }

      showUploadedFiles(true);
    } catch (exp) {
      console.log(exp.message);
    }
  }
}

function onClickView(fileName) {
  var objCurrentDWT = __getDWTObject();

  var CurrentPathName, CurrentPath, strActionPage, strHTTPServer, downloadsource;
  if (location.port == '') {
    objCurrentDWT.HTTPPort = Dynamsoft.Lib.detect.ssl ? 443 : 80;
  } else {
    objCurrentDWT.HTTPPort = location.port;
  }

  objCurrentDWT.IfSSL = Dynamsoft.Lib.detect.ssl;
  CurrentPathName = unescape(location.pathname);	// get current PathName in plain ASCII	
  CurrentPath = CurrentPathName.substring(0, CurrentPathName.lastIndexOf("/") + 1);
  strActionPage = CurrentPath + strDownloadPage; //the ActionPage's file path
  strHTTPServer = location.hostname;

  appendMessage('<b>Downloaded image: </b>');
  var OnSuccess = function () {
    checkErrorStringWithErrorCode(0, 'Successful.');
    if (bMobile) {
      __hideDWTWrapper();
      if (thumbnail)
        thumbnail.hide();
      bShowThumbnail = false;
      __enableThumbnailButton();
    }
  };

  var OnFailure = function (errorCode, errorString) {
    checkErrorStringWithErrorCode(errorCode, errorString);
  };

  objCurrentDWT.HTTPDownload(strHTTPServer, CurrentPath + "../UploadedImages/" + fileName, OnSuccess, OnFailure);
}

//---------------------------------------------------------------------------------
//************************** Navigator functions***********************************
//---------------------------------------------------------------------------------
function btnPreImage_wheel() {
  if (DWObject.HowManyImagesInBuffer != 0)
    btnPreImage_onclick()
}

function btnNextImage_wheel() {
  if (DWObject.HowManyImagesInBuffer != 0)
    btnNextImage_onclick()
}

function btnPreImage_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  DWObject.Viewer.previous();
  updatePageInfo();
}
function btnNextImage_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  DWObject.Viewer.next();
  updatePageInfo();
}


function btnRemoveCurrentImage_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }
  if (bNotShowMessageAgain) {
    RemoveCurrentImage();
  } else {
    var title = 'Are you sure to delete current page?';
    var ObjString = [
      '<div class="dynamsoft-dwt-header"></div>',
      '<div class="dynamsoft-dwt-dlg-title">',
      title,
      '</div>'];

    ObjString.push("<div class='dynamsoft-dwt-showMessage'><label class='dynamsoft-dwt-showMessage-detail' for = 'showMessage'><input type='checkbox' id='showMessage'/>Don't show this message again.&nbsp;</label></div>");
    ObjString.push('<div class="dynamsoft-dwt-installdlg-buttons"><input id="btnDelete" class="button-yes" type="button" value="Yes" onclick ="RemoveCurrentImage()"/><input id="btnCancel" class="button-no" type="button" value="No" onclick ="btnCancel_click()"/> </div>');
    Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true);
  }
}

function RemoveCurrentImage() {
  DWObject.RemoveImage(DWObject.CurrentImageIndexInBuffer);
  if (DWObject.HowManyImagesInBuffer == 0)
    DWObject.RemoveImage(0);
  var showMessage = document.getElementById("showMessage");
  if (showMessage && showMessage.checked)
    bNotShowMessageAgain = true;

  updatePageInfo();
  Dynamsoft.DWT.CloseDialog();
}

function btnCancel_click() {
  var showMessage = document.getElementById("showMessage");
  if (showMessage && showMessage.checked)
    bNotShowMessageAgain = true;
  Dynamsoft.DWT.CloseDialog();
}

function RemoveAllImages() {
  DWObject.RemoveAllImages();
  DWObject.RemoveImage(0);

  Dynamsoft.DWT.CloseDialog();
}

function btnRemoveAllImages_onclick() {
  if (!checkIfImagesInBuffer()) {
    return;
  }

  var title = 'Are you sure to delete all pages?';
  var ObjString = [
    '<div class="dynamsoft-dwt-header"></div>',
    '<div class="dynamsoft-dwt-dlg-title">',
    title,
    '</div>'];

  ObjString.push('<div class="dynamsoft-dwt-installdlg-iconholder"><input id="btnDelete" class="button-yes" type="button" value="Yes" onclick ="RemoveAllImages()"/><input id="btnCancel" class="button-no" type="button" value="No" onclick ="btnCancel_click()"/> </div>');
  Dynamsoft.DWT.ShowDialog(500, 0, ObjString.join(''), true);
}

//--------------------------------------------------------------------------------------
//************************** Dynamic Web TWAIN Events***********************************
//--------------------------------------------------------------------------------------
function Dynamsoft_CloseImageEditorUI() {
  updatePageInfo();
}

function Dynamsoft_OnBitmapChanged(aryIndex, type) {
  if (type == 3) {
    updatePageInfo();
  }

  if (type == 4)
    updateZoomInfo();

  if (type == 5)  //only ActiveX
    Dynamsoft_OnImageAreaDeselected();
}

function Dynamsoft_OnPostTransfer() {
  updatePageInfo();
}

function Dynamsoft_OnPostLoadfunction(path, name, type) {
  updatePageInfo();
}

function Dynamsoft_OnPostAllTransfers() {
  DWObject.CloseSource();
  updatePageInfo();
}

function Dynamsoft_OnMouseClick() {
  updatePageInfo();
}

function Dynamsoft_OnMouseWheel() {
  updatePageInfo();
}

function Dynamsoft_OnImageAreaSelected(index, rect) {
  if (rect.length > 0) {
    var currentRect = rect[rect.length - 1];
    _iLeft = currentRect.x;
    _iTop = currentRect.y;
    _iRight = currentRect.x + currentRect.width;
    _iBottom = currentRect.y + currentRect.height;

    enableButtonForCrop(true);
  }
}

function Dynamsoft_OnImageAreaDeselected(index) {
  _iLeft = 0;
  _iTop = 0;
  _iRight = 0;
  _iBottom = 0;

  enableButtonForCrop(false);
}

function Dynamsoft_OnGetFilePath(bSave, count, index, path, name) {

}

function Dynamsoft_OnIndexChangeDragDropDone(event) {
  updatePageInfo();
}

function Dynamsoft_OnKeyDown() {
  updatePageInfo();
}

function showUploadedFiles(bShow) {
  var tabSave = document.getElementById("tabSave");
  var tabUploadedFiles = document.getElementById("tabUploadedFiles");
  var divSaveDetail = document.getElementById("divSaveDetail");
  var divUploadedFiles = document.getElementById("divUploadedFiles");
  if (tabSave && tabUploadedFiles && divSaveDetail && divUploadedFiles) {
    if (bShow) {
      tabSave.className = "tabList unselectTab";
      tabUploadedFiles.className = "tabList selectTab";
      divSaveDetail.style.display = "none";
      divUploadedFiles.style.display = "block";
    } else {

      tabSave.className = "tabList selectTab";
      tabUploadedFiles.className = "tabList unselectTab";
      divSaveDetail.style.display = "block";
      divUploadedFiles.style.display = "none";
    }
  }
}