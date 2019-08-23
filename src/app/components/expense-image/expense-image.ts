import { Component, ElementRef, ViewChild, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core'
import { AngularFireStorage } from '@angular/fire/storage'
import { Events, LoadingController, AlertController } from '@ionic/angular'
import { Subscription, ReplaySubject, Observable } from 'rxjs'
import { UtilsService } from 'src/app/services/utils.service'
import { File as IonicFileService, FileReader as IonicFileReader, IFile, FileEntry as IonicFileEntry } from '@ionic-native/file/ngx'
import { FilePath } from '@ionic-native/file-path/ngx'
import { skipUntil, finalize } from 'rxjs/operators';


// import { SwipeBackGesture } from 'ionic-angular/navigation/swipe-back';

@Component({
  selector: 'expense-image',
  templateUrl: 'expense-image.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseImageComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput')
  fileInput: ElementRef;
  selectedFiles: FileList
  intentFileAvailable: boolean = false;
  private intentBlob: Blob;
  file: File
  imgsrc
  private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1)
  loader: HTMLIonLoadingElement
  uploadPercent: Observable<number>;
  downloadURL: Observable<any>;

  constructor(
    private storage: AngularFireStorage,
    public events: Events,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private utils: UtilsService,
    private fileService: IonicFileService,
    private filePath: FilePath,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit () {
    // FIXME: refactor subscription
    this.events.subscribe('upload:image', () => {
      if (this.selectedFiles) {
        this.presentLoading()
        this.uploadPic(this.selectedFiles.item(0))
      } else if (this.intentFileAvailable) {
        this.uploadPic(this.intentBlob)
      } else {
        this.events.publish('uploaded:image', {
          imageName: null,
          imageUrl: null
        })
        return
      }
    })

    this.utils.image.subscribe(async (resp:any) => {
      try {
        const resolvedPath = await this.filePath.resolveNativePath(resp['android.intent.extra.STREAM'])
        const resolvedFSUrl: IonicFileEntry = await <unknown>this.fileService.resolveLocalFilesystemUrl(resolvedPath) as IonicFileEntry

        const cordovaFile: IFile = await this.utils.convertFileEntryToCordovaFile(resolvedFSUrl)

        this.intentBlob = await this.utils.convertCordovaFileToJavascriptFile(cordovaFile)
        this.imgsrc = await this.renderFile(this.intentBlob)
        this.intentFileAvailable = true
        this.cdRef.detectChanges()
      } catch (error) {
        console.log(error)
        
      }
    })
  }

  async presentLoading () {
    this.loader = await this.loadingCtrl.create({
      message: 'Uploading Image, Please wait...',
      spinner: 'bubbles'
    })
    await this.loader.present()
  }
  
  async chooseFile(event) {
    this.selectedFiles = event.target.files
    const DataURL = await this.renderFile(this.selectedFiles.item(0))
    this.imgsrc = DataURL
    this.cdRef.detectChanges()
  }

  renderFile(file): Promise<any> {
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onloadend = (event) => {
        if (reader.error) {
          reject(reader.error)
          console.log(reader.error)
        } else {
          resolve(reader.result)
        }
      }

      reader.readAsDataURL(file)
    })

  }

  // FIXME: clearSelection(event:SwipeBackGesture){
  clearSelection(event) {
    this.nullify()
  }

  async uploadPic(file) {
    // debugger
    const uniqueKey = `pic${Math.floor(Math.random() * 1000000)}`

    // try {
      // const ref = this.storage.ref(`/receipts/${uniqueKey}`)
      const webPref = this.storage.ref(`/receipts/opt${uniqueKey}`)
      const filePath = `/receipts-next/${uniqueKey}`
      const fileRef = this.storage.ref(filePath)
      // const task = this.storage.upload(`/receipts-next/${uniqueKey}`, file);
      // await this.storage.upload(`/receipts-next/${uniqueKey}`, file)
      const task =  this.storage.upload(filePath, file);
      this.uploadPercent = task.percentageChanges();
      task.snapshotChanges().pipe(
        finalize(() => {
          this.downloadURL = fileRef.getDownloadURL()
          console.log('Finalized')
        })
      ).subscribe()
      //https://github.com/angular/angularfire2/blob/master/docs/storage/storage.md
      // // this.imgsrc = ;
      // webPref.getDownloadURL().subscribe(resp => {
      //   console.log('getDownloadURL', resp);
        this.events.publish('uploaded:image', {
          imageName: `opt${uniqueKey}`,
          // imageUrl: resp
        })
      // }, error => { 
      //   console.log(error)
      // })
      // FIXME: Fix the loading as the below line is throwing error
      this.loader.dismiss()
      this.loader.onDidDismiss().then(x => this.nullify())
    // } catch (error) {

    //   this.handleUploadError()
    //   console.log('Upload Task Failed', error)
    // }

  }
  // async uploadPic(file) {
  //   // debugger
  //   const uniqueKey = `pic${Math.floor(Math.random() * 1000000)}`

  //   try {
  //     // const ref = this.storage.ref(`/receipts/${uniqueKey}`)
  //     const webPref = this.storage.ref(`/receipts/opt${uniqueKey}`)
  //     // const task = this.storage.upload(`/receipts-next/${uniqueKey}`, file);
  //     // await this.storage.upload(`/receipts-next/${uniqueKey}`, file)
  //     await this.storage.upload(`/receipts-next/${uniqueKey}`, file).percentageChanges().subscribe(resp => {
  //       console.log('percentChanges', resp)
  //     })

  //     // // this.imgsrc = ;
  //     // webPref.getDownloadURL().subscribe(resp => {
  //     //   console.log('getDownloadURL', resp);
  //       this.events.publish('uploaded:image', {
  //         imageName: `opt${uniqueKey}`,
  //         // imageUrl: resp
  //       })
  //     // }, error => { 
  //     //   console.log(error)
  //     // })
  //     // FIXME: Fix the loading as the below line is throwing error
  //     this.loader.dismiss()
  //     this.loader.onDidDismiss().then(x => this.nullify())
  //   } catch (error) {

  //     this.handleUploadError()
  //     console.log('Upload Task Failed', error)
  //   }

  // }

  nullify() {
    this.selectedFiles = null
    this.fileInput.nativeElement.value = ''
    this.intentFileAvailable = false
    this.imgsrc = null
    this.cdRef.detectChanges()
  }

  async handleUploadError() {
    this.loader && this.loader.dismiss()
    await this.presentErrorAlert()
    this.events.publish('uploading:cancelled')
  }
  
  async presentErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Error!',
      subHeader: 'Something went wrong',
      buttons: ['Ok']
    })

    await alert.present()
  }

  ngOnDestroy() {
    this.destroyed$.next(true)
    this.destroyed$.complete()
  }
}
